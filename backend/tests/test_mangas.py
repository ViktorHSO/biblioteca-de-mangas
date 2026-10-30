def test_criar_e_buscar_manga(client, criar_manga):
    manga = criar_manga(tipo="manhwa", status="lendo")
    assert manga["tipo"] == "manhwa"
    assert manga["visualizacoes"] == 0

    resposta = client.get(f"/mangas/{manga['id']}")
    assert resposta.status_code == 200
    assert resposta.json()["capitulos"] == []


def test_listagem_e_publica_e_paginada(client, criar_manga):
    for i in range(3):
        criar_manga(titulo=f"Obra {i}")
    resposta = client.get("/mangas/", params={"limit": 2, "ordenar": "titulo"})
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["total"] == 3
    assert [m["titulo"] for m in corpo["itens"]] == ["Obra 0", "Obra 1"]


def test_limite_da_paginacao_e_validado(client):
    assert client.get("/mangas/", params={"limit": 1000}).status_code == 422
    assert client.get("/mangas/", params={"skip": -1}).status_code == 422


def test_busca_trata_curingas_do_sql_como_texto(client, criar_manga):
    criar_manga(titulo="One Piece")
    criar_manga(titulo="100% Perfeito")
    resposta = client.get("/mangas/", params={"titulo": "%"})
    assert [m["titulo"] for m in resposta.json()["itens"]] == ["100% Perfeito"]
    assert client.get("/mangas/", params={"titulo": "_"}).json()["total"] == 0


def test_filtros_por_status_e_tipo(client, criar_manga):
    criar_manga(titulo="A", status="lendo", tipo="manhwa")
    criar_manga(titulo="B", status="concluído", tipo="mangá")
    assert client.get("/mangas/", params={"status": "lendo"}).json()["total"] == 1
    assert client.get("/mangas/", params={"tipo": "mangá"}).json()["itens"][0]["titulo"] == "B"
    assert client.get("/mangas/", params={"status": "inventado"}).status_code == 422


def test_validacao_de_campos(client, auth):
    invalidos = [
        {"titulo": ""},
        {"titulo": "   "},
        {"titulo": "x" * 256},
        {"titulo": "X", "status": "abandonado"},
        {"titulo": "X", "tipo": "revista"},
        {"titulo": "X", "campo_extra": "nao permitido"},
        {"titulo": "X", "capa_url": "javascript:alert(1)"},
        {"titulo": "X", "capa_url": "data:text/html;base64,PHNjcmlwdD4="},
        {"titulo": "X", "capa_url": "ftp://exemplo.com/capa.jpg"},
        {"titulo": "X", "capa_url": "https://" + "a" * 600 + ".com"},
    ]
    for corpo in invalidos:
        resposta = client.post("/mangas/", json=corpo, headers=auth)
        assert resposta.status_code == 422, f"deveria recusar {corpo}"


def test_capa_vazia_vira_nula(client, criar_manga):
    manga = criar_manga(capa_url="", autor="")
    assert manga["capa_url"] is None
    assert manga["autor"] is None


def test_atualizar_e_deletar(client, auth, criar_manga):
    manga = criar_manga()
    resposta = client.put(f"/mangas/{manga['id']}", json={"titulo": "Vagabond (Edição Definitiva)"}, headers=auth)
    assert resposta.status_code == 200
    assert resposta.json()["titulo"] == "Vagabond (Edição Definitiva)"

    assert client.delete(f"/mangas/{manga['id']}", headers=auth).status_code == 200
    assert client.get(f"/mangas/{manga['id']}").status_code == 404


def test_ranking_por_visualizacoes(client, criar_manga):
    pouco = criar_manga(titulo="Pouco visto")
    muito = criar_manga(titulo="Muito visto")
    for _ in range(3):
        client.post(f"/mangas/{muito['id']}/visualizar")
    client.post(f"/mangas/{pouco['id']}/visualizar")

    ranking = client.get("/mangas/ranking").json()
    assert [(m["posicao"], m["titulo"]) for m in ranking] == [(1, "Muito visto"), (2, "Pouco visto")]
    assert ranking[0]["visualizacoes"] == 3


def test_visualizar_manga_inexistente(client):
    assert client.post("/mangas/999/visualizar").status_code == 404


def test_destaques_priorizam_os_marcados(client, criar_manga):
    criar_manga(titulo="Com capa", capa_url="https://exemplo.com/a.jpg")
    criar_manga(titulo="Destaque", destaque=True)
    assert [m["titulo"] for m in client.get("/mangas/destaques").json()] == ["Destaque"]


def test_destaques_sem_marcados_usam_os_que_tem_capa(client, criar_manga):
    criar_manga(titulo="Sem capa")
    criar_manga(titulo="Com capa", capa_url="https://exemplo.com/a.jpg")
    assert [m["titulo"] for m in client.get("/mangas/destaques").json()] == ["Com capa"]


def test_generos_sao_separados_e_unicos(client, criar_manga):
    criar_manga(titulo="A", genero="Ação, Aventura")
    criar_manga(titulo="B", genero="aventura, Drama")
    assert client.get("/mangas/generos").json() == ["Ação", "Aventura", "Drama"]


def test_cabecalhos_de_seguranca(client):
    resposta = client.get("/")
    assert resposta.headers["X-Content-Type-Options"] == "nosniff"
    assert resposta.headers["X-Frame-Options"] == "DENY"


def test_cors_so_libera_origem_configurada(client):
    permitida = client.get("/", headers={"Origin": "http://localhost:5173"})
    estranha = client.get("/", headers={"Origin": "https://site-malicioso.com"})
    assert permitida.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-origin" not in estranha.headers


def test_datas_saem_com_fuso_utc(client, criar_manga):
    manga = criar_manga()
    assert manga["criado_em"].endswith(("Z", "+00:00"))
    assert manga["atualizado_em"].endswith(("Z", "+00:00"))
