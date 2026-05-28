# Extrae y limpia los PDFs de Guardia Civil (PyMuPDF) y construye los tema-NN.json.
# Filtra páginas "gráficas" (infografías/portadas) que linealizan mal y conserva prosa.
import fitz, os, re, json, glob

SRC = r'E:/opodam/GC'
OUT = 'src/data/topics/guardia-civil'
os.makedirs(OUT, exist_ok=True)

NOISE = [
    re.compile(r'aspirantes', re.I),
    re.compile(r'info@'),
    re.compile(r'Ingreso al Cuerpo de la', re.I),
    re.compile(r'^a?rdia Civil', re.I),
    re.compile(r'por Anabel', re.I),
    re.compile(r'^\s*\d{1,4}\s*$'),
    re.compile(r'robado', re.I),
]

def es_ruido(l):
    t = l.strip()
    if len(t) < 3:
        return True
    return any(p.search(t) for p in NOISE)

def limpiar_pagina_buena(txt):
    lineas = txt.split('\n')
    largas = [l for l in lineas if len(l.strip()) >= 50]
    return len(largas) >= 4  # página con prosa real

def limpiar(txt):
    out = []
    for l in txt.split('\n'):
        if es_ruido(l):
            continue
        out.append(re.sub(r'[ \t]{2,}', ' ', l.rstrip()))
    s = '\n'.join(out)
    s = re.sub(r'\n{3,}', '\n\n', s).strip()
    return s

def titulo_de(texto, tid):
    for l in texto.split('\n'):
        t = l.strip().rstrip('.: ')
        if 12 <= len(t) <= 80 and t == t.upper() and re.search(r'[A-ZÁÉÍÓÚÑ]', t) and re.search(r'[AEIOUÁÉÍÓÚ]', t, re.I):
            # capitaliza
            return t[0] + t[1:].lower()
    return f'Tema {tid}'

titulos = {}
for path in sorted(glob.glob(os.path.join(SRC, 'Tema-*.pdf'))):
    name = os.path.basename(path)
    m = re.match(r'Tema-(\d+)', name, re.I)
    if not m:
        continue
    tid = int(m.group(1))
    try:
        doc = fitz.open(path)
    except Exception as e:
        print('FAIL', name, e); continue
    buenas = []
    for i in range(doc.page_count):
        t = doc[i].get_text()
        if limpiar_pagina_buena(t):
            buenas.append(t)
    doc.close()
    contenido = limpiar('\n'.join(buenas))
    titulo = titulo_de(contenido, tid)
    titulos[tid] = titulo
    tema = {
        'id': tid,
        'titulo': titulo,
        'bloque': 'general',
        'secciones': [{'titulo': '', 'contenido': contenido}],
        'esquemas': [],
        'mapaMental': {'nodos': [], 'aristas': []},
        'flashcards': [],
        'preguntas': [],
    }
    with open(os.path.join(OUT, f'tema-{tid:02d}.json'), 'w', encoding='utf-8') as f:
        json.dump(tema, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'OK tema-{tid:02d} ({len(contenido)} chars) "{titulo[:55]}"')

os.makedirs('.tmp_md/gc', exist_ok=True)
with open('.tmp_md/gc/titulos.json', 'w', encoding='utf-8') as f:
    json.dump(titulos, f, ensure_ascii=False, indent=2)
print('temas:', len(titulos))
