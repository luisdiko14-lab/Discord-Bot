// script.js
const t = document.getElementById("token")
const p = document.getElementById("prefix")
const s = document.getElementById("status")
const ty = document.getElementById("type")
const tx = document.getElementById("text")
const o = document.getElementById("out")
const d = document.getElementById("download")

function build(){
  o.textContent =
`TOKEN=${t.value}
PREFIX=${p.value || "!"}
STATUS=${s.value}
ACTIVITY_TYPE=${ty.value}
ACTIVITY_TEXT=${tx.value}`
}

[t,p,s,ty,tx].forEach(e => e.addEventListener("input", build))

d.onclick = () => {
  const blob = new Blob([o.textContent])
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "config.env"
  a.click()
}

build()
