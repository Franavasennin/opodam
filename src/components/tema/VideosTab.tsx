import type { Tema } from '../../types'

interface Props { tema: Tema }

export function VideosTab({ tema }: Props) {
  const videos = tema.videos ?? []
  if (!videos.length) {
    return <p style={{ color: 'var(--mute)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>Sin vídeos para este tema.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {videos.map((v, i) => (
        <div key={v.youtubeId + i}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{v.titulo}</div>
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', borderRadius: 14, overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
              title={v.titulo}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
