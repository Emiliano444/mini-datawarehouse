import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'

// ── Colores ──────────────────────────────────────────────────
const AZUL    = 'rgba(26,60,94,0.85)'
const NARANJA = 'rgba(255,140,0,0.85)'
const ROJO    = 'rgba(220,53,69,0.85)'
const VERDE   = 'rgba(25,135,84,0.85)'

export default function App() {
  const [vista,    setVista]    = useState('retrasos')
  const [resumen,  setResumen]  = useState(null)
  const [retrasos, setRetrasos] = useState([])
  const [estados,  setEstados]  = useState([])
  const [envios,   setEnvios]   = useState([])
  const [meses,    setMeses]    = useState([])
  const [datos,    setDatos]    = useState([])
  const [cargando, setCargando] = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/resumen`).then(r => r.json()),
      fetch(`${API}/api/retrasos-por-categoria`).then(r => r.json()),
      fetch(`${API}/api/ventas-por-estado`).then(r => r.json()),
      fetch(`${API}/api/costo-envio`).then(r => r.json()),
      fetch(`${API}/api/ventas-por-mes`).then(r => r.json()),
      fetch(`${API}/api/datos`).then(r => r.json()),
    ])
    .then(([res, ret, est, env, mes, dat]) => {
      setResumen(res)
      setRetrasos(ret)
      setEstados(est)
      setEnvios(env)
      setMeses(mes)
      setDatos(dat.datos || [])
      setCargando(false)
    })
    .catch(e => { setError(e.message); setCargando(false) })
  }, [])

  if (cargando) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <p style={{ color: '#1A3C5E', marginTop: 16, fontSize: 16 }}>
        Conectando con Supabase...
      </p>
    </div>
  )
  if (error) return (
    <div style={s.center}>
      <p style={{ color: '#dc3545', fontSize: 18 }}>❌ {error}</p>
      <p style={{ color: '#555', fontSize: 13 }}>Verifica que api.py esté corriendo en puerto 5000</p>
    </div>
  )

  const tabs = [
    { id: 'retrasos', label: '📦 Retrasos por Categoria' },
    { id: 'estados',  label: '🗺 Ventas por Estado'       },
    { id: 'envios',   label: '🚚 Costo de Envio'          },
    { id: 'meses',    label: '📅 Actividad por Mes'       },
    { id: 'tabla',    label: '📋 Todos los Registros'     },
  ]

  return (
    <div style={s.app}>

      {/* HEADER */}
      <header style={s.header}>
        <div>
          <h1 style={s.titulo}>🗄 Mini Data Warehouse</h1>
          <p style={s.subtitulo}>Brazilian E-Commerce (Olist) · Supabase · Flask · React</p>
        </div>
        <span style={s.badge}>● En vivo</span>
      </header>

      {/* TARJETAS */}
      {resumen && (
        <div style={s.cards}>
          <Card valor={resumen.total_tcp}                        label="Registros TCP"      color={AZUL}    />
          <Card valor={resumen.total_udp}                        label="Registros UDP"      color={NARANJA} />
          <Card valor={resumen.total_tardias}                    label="Entregas tardias"   color={ROJO}    />
          <Card valor={resumen.total_categorias}                 label="Categorias"         color={VERDE}   />
          <Card valor={`$${resumen.avg_flete?.toFixed(2)}`}      label="Flete promedio"     color="#6f42c1" />
          <Card valor={`$${resumen.total_ventas?.toLocaleString()}`} label="Total ventas"   color="#0d6efd" />
        </div>
      )}

      {/* TABS DE NAVEGACION */}
      <div style={s.tabs}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setVista(t.id)}
            style={{ ...s.tab, ...(vista === t.id ? s.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── VISTA: RETRASOS POR CATEGORIA ── */}
      {vista === 'retrasos' && (
        <div style={s.seccion}>
          <h2 style={s.secTitulo}>
            Categorias con mas entregas tardias
            <span style={s.pregunta}>"¿Qué categorías tienen más entregas fuera de tiempo?"</span>
          </h2>
          <div style={s.row}>
            <div style={{ flex: 2 }}>
              <Bar
                data={{
                  labels: retrasos.map(r => r.categoria.replace(/_/g,' ')),
                  datasets: [{
                    label: 'Entregas tardias',
                    data: retrasos.map(r => r.tardias),
                    backgroundColor: retrasos.map(r =>
                      r.pct_tardia > 60 ? ROJO : r.pct_tardia > 40 ? NARANJA : AZUL),
                    borderRadius: 4,
                  }]
                }}
                options={{
                  indexAxis: 'y', responsive: true,
                  plugins: { legend: { display: false },
                    title: { display: false } },
                  scales: {
                    x: { beginAtZero: true, ticks: { color: '#333' } },
                    y: { ticks: { color: '#333', font: { size: 12 } } }
                  }
                }}
              />
              <p style={s.leyenda}>
                 &gt;60% tardias &nbsp;  40–60% &nbsp;  &lt;40%
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Categoria</th>
                    <th style={s.th}>Tardias</th>
                    <th style={s.th}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {retrasos.slice(0, 10).map((r, i) => (
                    <tr key={i} style={{ background: i%2===0 ? '#f4f8fc':'#fff' }}>
                      <td style={s.td}>{r.categoria.replace(/_/g,' ')}</td>
                      <td style={{ ...s.td, textAlign:'center', fontWeight:'bold', color: ROJO }}>
                        {r.tardias}
                      </td>
                      <td style={{ ...s.td, textAlign:'center' }}>
                        <span style={{
                          background: r.pct_tardia>60 ? '#dc3545' : r.pct_tardia>40 ? '#FF8C00' : '#1A3C5E',
                          color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:11
                        }}>{r.pct_tardia}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA: VENTAS POR ESTADO ── */}
      {vista === 'estados' && (
        <div style={s.seccion}>
          <h2 style={s.secTitulo}>
            Volumen de ventas por estado
            <span style={s.pregunta}>"¿Cuál es el estado con mayor volumen de ventas?"</span>
          </h2>
          <div style={s.row}>
            <div style={{ flex: 2 }}>
              <Bar
                data={{
                  labels: estados.map(e => e.estado),
                  datasets: [
                    {
                      label: 'Total ventas ($)',
                      data: estados.map(e => e.total_ventas),
                      backgroundColor: AZUL, borderRadius: 4,
                    },
                    {
                      label: 'Ticket promedio ($)',
                      data: estados.map(e => e.ticket_promedio),
                      backgroundColor: NARANJA, borderRadius: 4,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { position:'top' } },
                  scales: {
                    x: { ticks: { color:'#333' } },
                    y: { beginAtZero: true, ticks: { color:'#333' } }
                  }
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Estado</th>
                    <th style={s.th}>Ordenes</th>
                    <th style={s.th}>Total $</th>
                  </tr>
                </thead>
                <tbody>
                  {estados.slice(0,10).map((e,i)=>(
                    <tr key={i} style={{ background: i%2===0?'#f4f8fc':'#fff' }}>
                      <td style={{ ...s.td, fontWeight:'bold', color:'#1A3C5E' }}>{e.estado}</td>
                      <td style={{ ...s.td, textAlign:'center' }}>{e.total_ordenes}</td>
                      <td style={{ ...s.td, textAlign:'right', color: VERDE }}>
                        ${e.total_ventas?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA: COSTO DE ENVIO ── */}
      {vista === 'envios' && (
        <div style={s.seccion}>
          <h2 style={s.secTitulo}>
            Costo promedio de envio por categoria
            <span style={s.pregunta}>"¿Cuál es el costo promedio de envío?"</span>
          </h2>
          <div style={s.row}>
            <div style={{ flex: 2 }}>
              <Bar
                data={{
                  labels: envios.map(e => e.categoria.replace(/_/g,' ')),
                  datasets: [
                    {
                      label: 'Flete promedio ($)',
                      data: envios.map(e => e.avg_flete),
                      backgroundColor: ROJO, borderRadius: 4,
                    },
                    {
                      label: 'Precio promedio ($)',
                      data: envios.map(e => e.avg_precio),
                      backgroundColor: AZUL, borderRadius: 4,
                    }
                  ]
                }}
                options={{
                  indexAxis: 'y', responsive: true,
                  plugins: { legend: { position:'top' } },
                  scales: {
                    x: { beginAtZero: true, ticks: { color:'#333' } },
                    y: { ticks: { color:'#333', font:{ size:11 } } }
                  }
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Categoria</th>
                    <th style={s.th}>Flete $</th>
                    <th style={s.th}>% del precio</th>
                  </tr>
                </thead>
                <tbody>
                  {envios.slice(0,10).map((e,i)=>(
                    <tr key={i} style={{ background: i%2===0?'#f4f8fc':'#fff' }}>
                      <td style={s.td}>{e.categoria.replace(/_/g,' ')}</td>
                      <td style={{ ...s.td, textAlign:'center', color: ROJO, fontWeight:'bold' }}>
                        ${e.avg_flete?.toFixed(2)}
                      </td>
                      <td style={{ ...s.td, textAlign:'center' }}>
                        <span style={{
                          background: e.pct_flete>30?'#dc3545':e.pct_flete>15?'#FF8C00':'#198754',
                          color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:11
                        }}>{e.pct_flete}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA: ACTIVIDAD POR MES ── */}
      {vista === 'meses' && (
        <div style={s.seccion}>
          <h2 style={s.secTitulo}>Actividad del sistema por mes (TCP vs UDP)</h2>
          <Bar
            data={{
              labels: meses.map(m => m.mes),
              datasets: [
                { label:'TCP', data:meses.map(m=>m.tcp), backgroundColor:AZUL,    borderRadius:4 },
                { label:'UDP', data:meses.map(m=>m.udp), backgroundColor:NARANJA, borderRadius:4 },
              ]
            }}
            options={{
              responsive: true,
              plugins: { legend:{ position:'top' } },
              scales: {
                x: { ticks:{ color:'#333' } },
                y: { beginAtZero:true, ticks:{ color:'#333' } }
              }
            }}
          />
        </div>
      )}

      {/* ── VISTA: TABLA COMPLETA ── */}
      {vista === 'tabla' && (
        <div style={s.seccion}>
          <h2 style={s.secTitulo}>Ultimos 200 registros TCP</h2>
          <div style={{ overflowX:'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['ID','Origen','Categoria','Tardia','Estado','Precio','Fecha'].map(h=>(
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.map((d,i)=>(
                  <tr key={d.id} style={{ background:i%2===0?'#f4f8fc':'#fff' }}>
                    <td style={{ ...s.td, color:'#999' }}>{d.id}</td>
                    <td style={{ ...s.td, fontWeight:'bold', color: AZUL }}>{d.origen}</td>
                    <td style={s.td}>{(d.categoria||'').replace(/_/g,' ')}</td>
                    <td style={{ ...s.td, textAlign:'center' }}>
                      <span style={{
                        background: d.entrega_tardia==='True'?'#dc3545':'#198754',
                        color:'#fff', padding:'2px 10px', borderRadius:12, fontSize:11
                      }}>{d.entrega_tardia==='True'?'Tarde':'A tiempo'}</span>
                    </td>
                    <td style={{ ...s.td, fontWeight:'bold' }}>{d.estado}</td>
                    <td style={{ ...s.td, textAlign:'right', color: VERDE }}>
                      {d.precio_total ? `$${parseFloat(d.precio_total).toFixed(2)}` : '-'}
                    </td>
                    <td style={{ ...s.td, color:'#888', whiteSpace:'nowrap', fontSize:12 }}>
                      {d.fecha?.substring(0,16)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer style={s.footer}>
        Mini Data Warehouse · Jose Emiliano Meneses Reyes &amp; Diego Lopez Vallesta · Debian 12
      </footer>
    </div>
  )
}

function Card({ valor, label, color }) {
  return (
    <div style={{ ...s.card, borderTop: `4px solid ${color}` }}>
      <div style={{ ...s.cardNum, color }}>{valor}</div>
      <div style={s.cardLabel}>{label}</div>
    </div>
  )
}

const s = {
  app      : { fontFamily:'Arial,sans-serif', background:'#f0f4f8', minHeight:'100vh' },
  header   : { background:'#1A3C5E', color:'#fff', padding:'22px 32px',
               display:'flex', justifyContent:'space-between', alignItems:'center' },
  titulo   : { margin:0, fontSize:24, fontWeight:'bold' },
  subtitulo: { margin:'4px 0 0', color:'#90b8d8', fontSize:13 },
  badge    : { background:'rgba(255,255,255,0.15)', padding:'6px 14px',
               borderRadius:20, fontSize:13, color:'#90EE90' },
  cards    : { display:'flex', gap:12, padding:'20px 24px 8px', flexWrap:'wrap' },
  card     : { background:'#fff', borderRadius:8, padding:'16px 20px', flex:1, minWidth:120,
               boxShadow:'0 2px 8px rgba(0,0,0,0.07)', textAlign:'center' },
  cardNum  : { fontSize:30, fontWeight:'bold' },
  cardLabel: { color:'#555', marginTop:4, fontSize:12 },
  tabs     : { display:'flex', gap:8, padding:'12px 24px', flexWrap:'wrap' },
  tab      : { padding:'8px 16px', borderRadius:6, border:'2px solid #1A3C5E',
               background:'#fff', color:'#1A3C5E', cursor:'pointer', fontSize:13,
               fontWeight:'bold', transition:'all 0.2s' },
  tabActive: { background:'#1A3C5E', color:'#fff' },
  seccion  : { background:'#fff', margin:'0 24px 20px', borderRadius:8,
               padding:24, boxShadow:'0 2px 8px rgba(0,0,0,0.07)' },
  secTitulo: { color:'#1A3C5E', marginTop:0, fontSize:18,
               borderBottom:'2px solid #e0e8f0', paddingBottom:10, display:'flex',
               flexDirection:'column', gap:4 },
  pregunta : { fontSize:13, color:'#888', fontStyle:'italic', fontWeight:'normal' },
  row      : { display:'flex', gap:24, flexWrap:'wrap', marginTop:16 },
  leyenda  : { fontSize:12, color:'#888', marginTop:8 },
  table    : { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th       : { background:'#1A3C5E', color:'#fff', padding:'10px 12px', textAlign:'left' },
  td       : { padding:'8px 12px', borderBottom:'1px solid #e8eef4', color:'#333' },
  footer   : { textAlign:'center', color:'#aaa', fontSize:12, padding:24 },
  center   : { display:'flex', flexDirection:'column', justifyContent:'center',
               alignItems:'center', height:'100vh' },
  spinner  : { width:40, height:40, border:'4px solid #e0e8f0',
               borderTop:'4px solid #1A3C5E', borderRadius:'50%',
               animation:'spin 0.8s linear infinite' },
}
