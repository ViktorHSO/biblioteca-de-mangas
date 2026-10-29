def test_criar_capitulo_em_manga_inexistente_da_404(client, auth):
    resposta = client.post("/capitulos/", json={"manga_id": 999, "numero": 1}, headers=auth)
    assert resposta.status_code == 404


def test_numero_de_capitulo_repetido_da_409(client, criar_manga, criar_capitulo, auth):
    manga = criar_manga()
    criar_capitulo(manga["id"], 1)
    resposta = client.post("/capitulos/", json={"manga_id": manga["id"], "numero": 1}, headers=auth)
    assert resposta.status_code == 409


def test_numero_de_capitulo_precisa_ser_positivo(client, criar_manga, auth):
    manga = criar_manga()
    for numero in (0, -3):
        resposta = client.post("/capitulos/", json={"manga_id": manga["id"], "numero": numero}, headers=auth)
        assert resposta.status_code == 422


def test_capitulos_do_manga_em_ordem_decrescente(client, criar_manga, criar_capitulo):
    manga = criar_manga()
    for numero in (1, 3, 2):
        criar_capitulo(manga["id"], numero)
    numeros = [c["numero"] for c in client.get(f"/capitulos/manga/{manga['id']}").json()]
    assert numeros == [3, 2, 1]
    assert [c["numero"] for c in client.get(f"/mangas/{manga['id']}").json()["capitulos"]] == [3, 2, 1]


def test_leitura_traz_paginas_e_navegacao(client, auth, criar_manga, criar_capitulo):
    manga = criar_manga()
    cap1 = criar_capitulo(manga["id"], 1)
    cap2 = criar_capitulo(manga["id"], 2, titulo="O duelo")
    cap3 = criar_capitulo(manga["id"], 3)

    urls = ["https://exemplo.com/p1.jpg", "https://exemplo.com/p2.jpg"]
    resposta = client.put(f"/capitulos/{cap2['id']}/paginas", json={"urls": urls}, headers=auth)
    assert resposta.status_code == 200
    assert [p["ordem"] for p in resposta.json()] == [1, 2]

    leitura = client.get(f"/capitulos/{cap2['id']}").json()
    assert [p["imagem_url"] for p in leitura["paginas"]] == urls
    assert leitura["anterior_id"] == cap1["id"]
    assert leitura["proximo_id"] == cap3["id"]
    assert leitura["manga"]["titulo"] == "Vagabond"


def test_substituir_paginas_troca_a_lista_inteira(client, auth, criar_manga, criar_capitulo):
    manga = criar_manga()
    cap = criar_capitulo(manga["id"], 1)
    client.put(f"/capitulos/{cap['id']}/paginas", json={"urls": ["https://a.com/1.jpg"] * 3}, headers=auth)
    client.put(f"/capitulos/{cap['id']}/paginas", json={"urls": ["https://b.com/1.jpg"]}, headers=auth)
    paginas = client.get(f"/capitulos/{cap['id']}").json()["paginas"]
    assert [p["imagem_url"] for p in paginas] == ["https://b.com/1.jpg"]


def test_paginas_recusam_urls_perigosas_e_listas_enormes(client, auth, criar_manga, criar_capitulo):
    manga = criar_manga()
    cap = criar_capitulo(manga["id"], 1)
    url = f"/capitulos/{cap['id']}/paginas"
    assert client.put(url, json={"urls": ["javascript:alert(1)"]}, headers=auth).status_code == 422
    assert client.put(url, json={"urls": []}, headers=auth).status_code == 422
    muitas = ["https://exemplo.com/p.jpg"] * 301
    assert client.put(url, json={"urls": muitas}, headers=auth).status_code == 422


def test_capitulos_recentes_trazem_o_manga(client, criar_manga, criar_capitulo):
    a = criar_manga(titulo="A")
    b = criar_manga(titulo="B")
    criar_capitulo(a["id"], 1)
    criar_capitulo(b["id"], 1)
    recentes = client.get("/capitulos/recentes").json()
    assert [c["manga"]["titulo"] for c in recentes] == ["B", "A"]


def test_atualizar_e_deletar_capitulo(client, auth, criar_manga, criar_capitulo):
    manga = criar_manga()
    cap = criar_capitulo(manga["id"], 1)
    criar_capitulo(manga["id"], 2)

    assert client.put(f"/capitulos/{cap['id']}", json={"numero": 2}, headers=auth).status_code == 409
    resposta = client.put(f"/capitulos/{cap['id']}", json={"numero": 1, "titulo": "Início"}, headers=auth)
    assert resposta.json()["titulo"] == "Início"

    assert client.delete(f"/capitulos/{cap['id']}", headers=auth).status_code == 200
    assert client.get(f"/capitulos/{cap['id']}").status_code == 404


def test_visualizar_capitulo_conta_no_manga(client, criar_manga, criar_capitulo):
    manga = criar_manga()
    cap = criar_capitulo(manga["id"], 1)
    assert client.post(f"/capitulos/{cap['id']}/visualizar").json() == {"visualizacoes": 1}
    assert client.get(f"/mangas/{manga['id']}").json()["visualizacoes"] == 1


def test_excluir_manga_apaga_capitulos_e_paginas(client, auth, criar_manga, criar_capitulo):
    manga = criar_manga()
    cap = criar_capitulo(manga["id"], 1)
    client.put(f"/capitulos/{cap['id']}/paginas", json={"urls": ["https://a.com/1.jpg"]}, headers=auth)
    client.delete(f"/mangas/{manga['id']}", headers=auth)
    assert client.get(f"/capitulos/{cap['id']}").status_code == 404
