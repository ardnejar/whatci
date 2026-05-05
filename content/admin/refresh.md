# [What CI](/) • [Admin](/admin) • Refresh

Refresh the calendar cache and re-register the Google Calendar watch channel.

<button id="refresh-btn" type="button">Refresh</button>

<p id="refresh-status" hidden></p>

<script type="module">
  const btn = document.getElementById('refresh-btn')
  const status = document.getElementById('refresh-status')

  btn.addEventListener('click', async () => {
    btn.disabled = true
    status.hidden = false
    status.textContent = 'Refreshing…'

    try {
      const res = await fetch('/admin/refresh', { method: 'POST' })
      const data = await res.json()
      status.textContent = res.ok ? 'Refresh complete.' : `Error: ${data.error ?? res.statusText}`
    } catch (err) {
      status.textContent = `Error: ${err.message}`
    } finally {
      btn.disabled = false
    }
  })
</script>
