from pathlib import Path

from app.core.uploads import PAGINA

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


def enviar(client, capitulo_id, arquivos, headers):
    files = [("arquivos", (nome, conteudo, "image/png")) for nome, conteudo in arquivos]
    return client.post(f"/capitulos/{capitulo_id}/paginas/arquivos", files=files, headers=headers)


def existe(caminho):
    return (PAGINA.diretorio / Path(caminho).name).exists()


def test_envia_paginas_no_fim_do_capitulo(client, auth, criar_manga, criar_capitulo):
    manga = criar_manga()
    cap = criar_capitulo(manga["id"], 1, paginas=["https://exemplo.com/p1.jpg"])

    resposta = enviar(client, cap["id"], [("02.png", PNG), ("03.jpg", JPG)], auth)
    assert resposta.status_code == 200, resposta.text
    paginas = client.get(f"/capitulos/{cap['id']}").json()["paginas"]
    assert [p["ordem"] for p in paginas] == [1, 2, 3]
    assert paginas[0]["imagem_url"] == "https://exemplo.com/p1.jpg"
    assert paginas[1]["imagem_url"].startswith("/uploads/paginas/") and paginas[1]["imagem_url"].endswith(".png")
    assert paginas[2]["imagem_url"].endswith(".jpg")
    assert client.get(paginas[1]["imagem_url"]).content == PNG


def test_um_arquivo_invalido_cancela_o_envio_inteiro(client, auth, criar_manga, criar_capitulo):
    cap = criar_capitulo(criar_manga()["id"], 1)
    antes = set(PAGINA.diretorio.iterdir())
    resposta = enviar(client, cap["id"], [("ok.png", PNG), ("falso.png", b"<svg></svg>")], auth)
    assert resposta.status_code == 422
    assert "falso.png" in resposta.json()["detail"]
    assert client.get(f"/capitulos/{cap['id']}").json()["paginas"] == []
    assert set(PAGINA.diretorio.iterdir()) == antes  # nenhum arquivo gravado


def test_envio_exige_login_e_respeita_limites(client, auth, criar_manga, criar_capitulo):
    cap = criar_capitulo(criar_manga()["id"], 1)
    assert enviar(client, cap["id"], [("a.png", PNG)], {}).status_code == 401
    assert enviar(client, 999, [("a.png", PNG)], auth).status_code == 404
    muitos = [(f"{i}.png", PNG) for i in range(31)]
    assert enviar(client, cap["id"], muitos, auth).status_code == 422
    grande = [("g.png", PNG + b"\x00" * (51 * 1024 * 1024))]
    assert enviar(client, cap["id"], grande, auth).status_code == 413


def test_edicao_reordena_e_apaga_paginas_removidas(client, auth, criar_manga, criar_capitulo):
    cap = criar_capitulo(criar_manga()["id"], 1)
    enviadas = [p["imagem_url"] for p in enviar(client, cap["id"], [("1.png", PNG), ("2.png", PNG)], auth).json()]

    # Reenvia só a segunda, como primeira página: a outra sai do capítulo e do disco.
    resposta = client.put(f"/capitulos/{cap['id']}", json={"numero": 1, "paginas": [enviadas[1]]}, headers=auth)
    assert resposta.status_code == 200, resposta.text
    paginas = client.get(f"/capitulos/{cap['id']}").json()["paginas"]
    assert [p["imagem_url"] for p in paginas] == [enviadas[1]]
    assert not existe(enviadas[0]) and existe(enviadas[1])

    # Caminhos que a API não gerou continuam recusados.
    for invalido in ["/uploads/paginas/../../.env", "/uploads/capas/" + "a" * 32 + ".png"]:
        r = client.put(f"/capitulos/{cap['id']}", json={"numero": 1, "paginas": [invalido]}, headers=auth)
        assert r.status_code == 422, invalido


def test_excluir_capitulo_ou_manga_apaga_as_imagens(client, auth, criar_manga, criar_capitulo):
    manga = criar_manga()
    cap1 = criar_capitulo(manga["id"], 1)
    cap2 = criar_capitulo(manga["id"], 2)
    pag1 = enviar(client, cap1["id"], [("1.png", PNG)], auth).json()[0]["imagem_url"]
    pag2 = enviar(client, cap2["id"], [("1.png", PNG)], auth).json()[0]["imagem_url"]

    client.delete(f"/capitulos/{cap1['id']}", headers=auth)
    assert not existe(pag1) and existe(pag2)

    client.delete(f"/mangas/{manga['id']}", headers=auth)
    assert not existe(pag2)
