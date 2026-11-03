from pathlib import Path

from app.core.uploads import CAPA

PASTA_CAPAS = CAPA.diretorio

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 64


def enviar(client, manga_id, conteudo, headers, nome="capa.png", tipo="image/png"):
    return client.post(f"/mangas/{manga_id}/capa", files={"arquivo": (nome, conteudo, tipo)}, headers=headers)


def arquivo_da_capa(caminho):
    return PASTA_CAPAS / Path(caminho).name


def test_envia_capa_e_serve_o_arquivo(client, auth, criar_manga):
    manga = criar_manga()
    resposta = enviar(client, manga["id"], WEBP, auth, nome="minha capa.webp", tipo="image/webp")
    assert resposta.status_code == 200, resposta.text
    caminho = resposta.json()["capa_url"]
    assert caminho.startswith("/uploads/capas/") and caminho.endswith(".webp")
    assert "minha" not in caminho  # o nome original não é usado no disco

    servido = client.get(caminho)
    assert servido.status_code == 200
    assert servido.content == WEBP
    assert servido.headers["x-content-type-options"] == "nosniff"


def test_envio_exige_login(client, criar_manga):
    manga = criar_manga()
    assert enviar(client, manga["id"], PNG, {}).status_code == 401


def test_recusa_arquivo_que_nao_e_imagem(client, auth, criar_manga):
    manga = criar_manga()
    # Extensão e Content-Type de imagem não bastam: o conteúdo é conferido.
    falso = b"<svg onload=alert(1)></svg>"
    resposta = enviar(client, manga["id"], falso, auth, nome="capa.png", tipo="image/png")
    assert resposta.status_code == 422
    assert enviar(client, manga["id"], b"", auth).status_code == 422
    assert client.get(f"/mangas/{manga['id']}").json()["capa_url"] is None


def test_recusa_imagem_grande_demais(client, auth, criar_manga):
    manga = criar_manga()
    grande = PNG + b"\x00" * (6 * 1024 * 1024)
    assert enviar(client, manga["id"], grande, auth).status_code == 413


def test_trocar_ou_apagar_remove_o_arquivo_antigo(client, auth, criar_manga):
    manga = criar_manga()
    primeira = enviar(client, manga["id"], PNG, auth).json()["capa_url"]
    segunda = enviar(client, manga["id"], WEBP, auth, nome="b.webp", tipo="image/webp").json()["capa_url"]
    assert not arquivo_da_capa(primeira).exists()
    assert arquivo_da_capa(segunda).exists()

    client.delete(f"/mangas/{manga['id']}", headers=auth)
    assert not arquivo_da_capa(segunda).exists()


def test_formulario_pode_reenviar_a_capa_enviada(client, auth, criar_manga):
    manga = criar_manga()
    caminho = enviar(client, manga["id"], PNG, auth).json()["capa_url"]
    resposta = client.put(f"/mangas/{manga['id']}", json={"titulo": "Novo título", "capa_url": caminho}, headers=auth)
    assert resposta.status_code == 200
    assert resposta.json()["capa_url"] == caminho
    assert arquivo_da_capa(caminho).exists()

    # Caminhos inventados continuam recusados.
    for invalido in ["/uploads/capas/../../.env", "/etc/passwd", "/uploads/capas/abc.svg"]:
        r = client.put(f"/mangas/{manga['id']}", json={"titulo": "X", "capa_url": invalido}, headers=auth)
        assert r.status_code == 422, invalido


def test_capa_de_manga_inexistente(client, auth):
    assert enviar(client, 999, PNG, auth).status_code == 404


def test_importar_capas_pelo_nome_do_arquivo(client, criar_manga, tmp_path, monkeypatch, capsys):
    from app import importar_capas

    manga = criar_manga(titulo="El Sentido Absoluto de la Espada")
    criar_manga(titulo="Outro Mangá")
    (tmp_path / "el sentido  absoluto de la espada.webp").write_bytes(WEBP)
    (tmp_path / "sem dono.png").write_bytes(PNG)
    (tmp_path / "notas.txt").write_text("ignorar")

    monkeypatch.setattr("sys.argv", ["importar_capas", str(tmp_path)])
    assert importar_capas.main() == 0
    saida = capsys.readouterr().out
    assert "1 de 2 imagens" in saida and "sem dono.png" in saida

    caminho = client.get(f"/mangas/{manga['id']}").json()["capa_url"]
    assert caminho.endswith(".webp") and arquivo_da_capa(caminho).exists()
