const si = require('systeminformation');
let loading = {}
let e = setInterval(() => {
  try {
    fetchAndSend('currentLoad')
    fetchAndSend('mem')
    fetchAndSend('battery')
    fetchAndSend('disksIO')
    fetchAndSend('networkStats')
  } catch  {
    process.exit(0)
  }
}, 500)

process.on('exit', () => { clearInterval(e) })

const fetchAndSend = async (indicator) => {
  if (loading[indicator]) return
  loading[indicator] = true
  try {
    let data = await si[indicator]()
    if (process) process.send(JSON.stringify({ indicator, data }))
  } catch (e) {}
  loading[indicator] = false
}
