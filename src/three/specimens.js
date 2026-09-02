// GrinKingdom — procedural 3D specimen kit.
// Every species gets a stylized low-poly "specimen" built from shared parts,
// so the whole encyclopedia scales without hand-modeling each organism.
// Realism levers: MeshStandardMaterial with tuned roughness/metalness,
// flat shading, higher segment counts and per-part material variation.

import * as THREE from 'three'

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.05,
    flatShading: true,
    ...opts,
  })

const matSoft = (color, opts = {}) => mat(color, { roughness: 0.85, metalness: 0, ...opts })
const matShiny = (color, opts = {}) => mat(color, { roughness: 0.28, metalness: 0.12, ...opts })

function add(group, geo, material, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) {
  const mesh = new THREE.Mesh(geo, material)
  mesh.position.set(...p)
  mesh.rotation.set(...r)
  mesh.scale.set(...(Array.isArray(s) ? s : [s, s, s]))
  group.add(mesh)
  return mesh
}

const INK = '#241f37'
const eyeGeo = new THREE.SphereGeometry(0.09, 10, 10)
function eyes(group, x, y, z, spread = 0.22, size = 1) {
  const m = mat(INK, { roughness: 0.25, metalness: 0.2 })
  add(group, eyeGeo, m, { p: [x - spread, y, z], s: size })
  add(group, eyeGeo, m, { p: [x + spread, y, z], s: size })
}

const curveTube = (pts, radius, segs = 6, tubular = 20) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), tubular, radius, segs)

/* ── microbes ─────────────────────────────────────────────── */

function virus([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.IcosahedronGeometry(0.85, 1), matShiny(a))
  const spikeGeo = new THREE.ConeGeometry(0.1, 0.42, 6)
  const knobGeo = new THREE.SphereGeometry(0.13, 8, 8)
  const dirs = new THREE.IcosahedronGeometry(1, 1).getAttribute('position')
  const seen = new Set()
  for (let i = 0; i < dirs.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(dirs, i).normalize()
    const key = v.toArray().map((n) => n.toFixed(2)).join(',')
    if (seen.has(key)) continue
    seen.add(key)
    const spike = add(g, spikeGeo, matShiny(b), { p: v.clone().multiplyScalar(1.0).toArray() })
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v)
    add(g, knobGeo, matShiny(b), { p: v.clone().multiplyScalar(1.22).toArray() })
  }
  return g
}

function phage([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.IcosahedronGeometry(0.55, 0), matShiny(a), { p: [0, 0.85, 0] })
  add(g, new THREE.CylinderGeometry(0.13, 0.13, 1.1, 8), matShiny(b), { p: [0, 0.05, 0] })
  add(g, new THREE.CylinderGeometry(0.3, 0.42, 0.16, 6), matShiny(b), { p: [0, -0.52, 0] })
  const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.95, 6)
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2
    add(g, legGeo, matShiny(a), {
      p: [Math.cos(ang) * 0.55, -0.85, Math.sin(ang) * 0.55],
      r: [Math.sin(ang) * 0.75, 0, -Math.cos(ang) * 0.75],
    })
  }
  return g
}

function helixRod([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.3, 0.3, 2.2, 12), matSoft(a), { r: [0, 0, Math.PI / 2] })
  const diskGeo = new THREE.TorusGeometry(0.34, 0.09, 8, 18)
  for (let i = 0; i < 7; i++)
    add(g, diskGeo, matSoft(b), { p: [-0.99 + i * 0.33, 0, 0], r: [0, Math.PI / 2, 0] })
  return g
}

function rod([a, b], { flagella = 0 } = {}) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.5, 1.2, 6, 14), matSoft(a), { r: [0, 0, Math.PI / 2] })
  const dotGeo = new THREE.SphereGeometry(0.09, 8, 8)
  for (let i = 0; i < 8; i++) {
    const ang = i * 2.4
    add(g, dotGeo, matSoft(b), {
      p: [-0.7 + i * 0.2, Math.cos(ang) * 0.45, Math.sin(ang) * 0.45],
    })
  }
  if (flagella) {
    const curve = (flip) => [
      new THREE.Vector3(1.05, 0, 0),
      new THREE.Vector3(1.45, 0.22 * flip, 0.1),
      new THREE.Vector3(1.8, -0.18 * flip, -0.12),
      new THREE.Vector3(2.15, 0.15 * flip, 0.08),
    ]
    add(g, curveTube(curve(1), 0.045), matSoft(b))
    add(g, curveTube(curve(-1), 0.045), matSoft(b))
    g.position.x = -0.35
  }
  return g
}

function coccus([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.IcosahedronGeometry(0.75, 1), matShiny(a))
  const lumps = [
    [0.55, 0.45, 0.3, 0.42], [-0.5, 0.5, -0.25, 0.38], [0.45, -0.5, -0.35, 0.4],
    [-0.55, -0.4, 0.35, 0.36], [0, 0.35, -0.6, 0.34], [-0.1, -0.25, 0.65, 0.35],
  ]
  lumps.forEach(([x, y, z, s], i) =>
    add(g, new THREE.IcosahedronGeometry(1, 1), mat(i % 2 ? b : a), { p: [x, y, z], s })
  )
  return g
}

function chain([a, b]) {
  const g = new THREE.Group()
  const beadGeo = new THREE.SphereGeometry(0.34, 12, 12)
  for (let i = 0; i < 7; i++) {
    const t = i - 3
    add(g, beadGeo, mat(i % 2 ? b : a), { p: [t * 0.52, Math.sin(t * 1.1) * 0.3, 0] })
  }
  g.scale.setScalar(0.85)
  return g
}

function twin([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.IcosahedronGeometry(0.6, 1), matShiny(a), { p: [-0.42, 0, 0] })
  add(g, new THREE.IcosahedronGeometry(0.6, 1), matShiny(b), { p: [0.42, 0, 0] })
  return g
}

function square([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.BoxGeometry(0.95, 0.95, 0.32), matSoft(a))
  const dotGeo = new THREE.SphereGeometry(0.09, 8, 8)
  for (let i = 0; i < 9; i++)
    add(g, dotGeo, matSoft(b), { p: [((i % 3) - 1) * 0.28, (Math.floor(i / 3) - 1) * 0.28, 0.18] })
  return g
}

function spiral([a, b]) {
  const g = new THREE.Group()
  for (let i = 0; i < 5; i++)
    add(g, new THREE.TorusGeometry(0.44, 0.15, 8, 16), matSoft(i % 2 ? b : a), { p: [0, -0.72 + i * 0.36, 0], r: [Math.PI / 2, 0, 0] })
  return g
}

function bullet([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.34, 1.0, 6, 12), matSoft(a), { r: [0, 0, Math.PI / 2] })
  add(g, new THREE.ConeGeometry(0.34, 0.6, 12), matShiny(b), { p: [0.95, 0, 0], r: [0, 0, -Math.PI / 2] })
  add(g, new THREE.SphereGeometry(0.3, 10, 10), matSoft(a), { p: [-0.85, 0, 0], s: [1.4, 1, 1] })
  return g
}

function brick([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.BoxGeometry(1.15, 0.72, 0.85), matSoft(a))
  const nubGeo = new THREE.SphereGeometry(0.07, 6, 6)
  for (let i = 0; i < 5; i++) {
    const x = -0.45 + i * 0.22
    add(g, nubGeo, matSoft(b), { p: [x, 0.28 + (i % 2) * 0.1, 0.44] })
    add(g, nubGeo, matSoft(b), { p: [x, -0.24 - (i % 2) * 0.08, 0.44] })
  }
  return g
}

function urchin([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.IcosahedronGeometry(0.52, 1), matShiny(a))
  const spikeGeo = new THREE.ConeGeometry(0.05, 0.75, 5)
  for (let i = 0; i < 26; i++) {
    const dir = new THREE.Vector3().setFromSphericalCoords(1, Math.acos(1 - 2 * ((i + 0.5) / 26)), i * 2.4)
    const spike = add(g, spikeGeo, matShiny(b), { p: dir.clone().multiplyScalar(0.85).toArray() })
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  }
  return g
}

function amoeba([a, b]) {
  const g = new THREE.Group()
  const body = new THREE.IcosahedronGeometry(0.95, 2)
  const pos = body.getAttribute('position')
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = 1 + 0.28 * Math.sin(v.x * 3.1) * Math.cos(v.y * 2.7) + 0.16 * Math.sin(v.z * 4.3)
    v.multiplyScalar(n)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  body.computeVertexNormals()
  add(g, body, mat(a, { transparent: true, opacity: 0.92 }))
  add(g, new THREE.SphereGeometry(0.34, 12, 12), mat(b), { p: [0.2, 0.15, 0.3] })
  const podGeo = new THREE.CapsuleGeometry(0.16, 0.5, 4, 8)
  add(g, podGeo, mat(a), { p: [1.05, -0.15, 0.2], r: [0, 0, Math.PI / 2.3] })
  add(g, podGeo, mat(a), { p: [-0.95, 0.35, -0.15], r: [0, 0, -Math.PI / 2.6] })
  return g
}

function slimeMold([a, b]) {
  const g = new THREE.Group()
  const blob = (x, y, z, s) => {
    const geo = new THREE.IcosahedronGeometry(1, 1)
    const p = geo.getAttribute('position')
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      v.multiplyScalar(1 + 0.22 * Math.sin(v.x * 4 + x) * Math.cos(v.y * 3 + y))
      p.setXYZ(i, v.x, v.y, v.z)
    }
    geo.computeVertexNormals()
    add(g, geo, matShiny(a), { p: [x, y, z], s })
  }
  blob(-0.55, -0.2, 0, 0.55)
  blob(0.45, 0.1, 0.2, 0.5)
  blob(0.1, -0.45, -0.25, 0.45)
  add(g, curveTube([new THREE.Vector3(-0.5, -0.15, 0), new THREE.Vector3(0.15, -0.1, 0.1), new THREE.Vector3(0.45, 0.1, 0.2)], 0.12), matShiny(b))
  add(g, curveTube([new THREE.Vector3(0.05, -0.4, -0.2), new THREE.Vector3(0.3, 0.05, 0)], 0.1), matShiny(a))
  return g
}

function ciliate([a, b]) {
  const g = new THREE.Group()
  const body = add(g, new THREE.SphereGeometry(0.75, 16, 16), matSoft(a), { s: [1.6, 0.85, 0.7] })
  body.rotation.z = 0.25
  add(g, new THREE.SphereGeometry(0.26, 10, 10), mat(b), { p: [0.25, 0.1, 0.35], s: [1.6, 0.8, 0.6] })
  const cGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 4)
  for (let i = 0; i < 26; i++) {
    const t = (i / 26) * Math.PI * 2
    const x = Math.cos(t) * 1.2, y = Math.sin(t) * 0.68
    add(g, cGeo, mat(b), { p: [x * 1.06, y * 1.06 + x * 0.2, 0], r: [0, 0, Math.atan2(-x, y * 1.6)] })
  }
  return g
}

function euglena([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.7, 14, 14), matSoft(a), { s: [1.7, 0.62, 0.62] })
  add(g, new THREE.SphereGeometry(0.12, 8, 8), mat(b), { p: [1.0, 0.18, 0] })
  add(g, curveTube([
    new THREE.Vector3(1.15, 0, 0),
    new THREE.Vector3(1.6, 0.3, 0.1),
    new THREE.Vector3(2.0, -0.15, -0.1),
    new THREE.Vector3(2.35, 0.2, 0.05),
  ], 0.04), mat(a))
  g.position.x = -0.5
  return g
}

function diatom([a, b]) {
  const g = new THREE.Group()
  const half = new THREE.SphereGeometry(0.55, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  add(g, half, matShiny(a), { p: [0, 0.28, 0] })
  const lower = add(g, half, matShiny(b), { p: [0, -0.28, 0] })
  lower.rotation.z = Math.PI
  add(g, new THREE.CylinderGeometry(0.56, 0.56, 0.1, 14), matShiny(a), { p: [0, 0, 0] })
  const dotGeo = new THREE.SphereGeometry(0.06, 6, 6)
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2
    add(g, dotGeo, mat(b), { p: [Math.cos(ang) * 0.4, 0.32, Math.sin(ang) * 0.4] })
  }
  return g
}

function tardigrade([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.62, 14, 12), matSoft(a), { s: [1.6, 1, 0.95] })
  add(g, new THREE.SphereGeometry(0.34, 10, 8), matSoft(b), { p: [1.05, 0.1, 0], s: [0.9, 1, 1] })
  eyes(g, 1.28, 0.16, 0.1, 0.14, 0.8)
  const legGeo = new THREE.CapsuleGeometry(0.12, 0.22, 4, 8)
  for (const dx of [-1, 1]) {
    add(g, legGeo, matSoft(b), { p: [dx * 0.55, -0.5, 0.42], r: [0.4, 0, dx * -0.3] })
    add(g, legGeo, matSoft(b), { p: [dx * 0.55, -0.5, -0.42], r: [-0.4, 0, dx * -0.3] })
    add(g, legGeo, matSoft(b), { p: [dx * 0.1, -0.55, 0.55], r: [0.5, 0, dx * -0.2] })
    add(g, legGeo, matSoft(b), { p: [dx * 0.1, -0.55, -0.55], r: [-0.5, 0, dx * -0.2] })
  }
  return g
}

function worm([a, b]) {
  const g = new THREE.Group()
  const segGeo = new THREE.SphereGeometry(0.3, 10, 10)
  const pts = []
  for (let i = 0; i < 8; i++) pts.push(new THREE.Vector3(-1.3 + i * 0.37, Math.sin(i * 0.85) * 0.4, 0))
  pts.forEach((p, i) => add(g, segGeo, matSoft(i % 2 ? b : a), { p: p.toArray(), s: [0.8, 0.7, 0.8] }))
  add(g, new THREE.SphereGeometry(0.24, 10, 8), matSoft(a), { p: [1.35, 0.35, 0], s: [0.9, 0.8, 0.8] })
  return g
}

/* ── fungi ────────────────────────────────────────────────── */

function mushroom([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.26, 0.36, 1.15, 10), matSoft('#f5efe0'), { p: [0, -0.45, 0] })
  add(g, new THREE.SphereGeometry(0.95, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), matSoft(a), { p: [0, 0.1, 0], s: [1, 0.78, 1] })
  add(g, new THREE.CylinderGeometry(0.95, 0.95, 0.06, 18), matSoft('#e8ddc8'), { p: [0, 0.1, 0] })
  const spotGeo = new THREE.SphereGeometry(0.09, 8, 8)
  const spots = [[0, 0.82, 0.15], [0.45, 0.6, 0.35], [-0.5, 0.55, 0.3], [0.25, 0.62, -0.5], [-0.3, 0.6, -0.45], [0.6, 0.45, -0.1]]
  spots.forEach(([x, y, z]) => add(g, spotGeo, mat(b), { p: [x, y, z], s: [1, 0.5, 1] }))
  return g
}

function shelf([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.28, 0.42, 1.2, 10), matSoft(b), { p: [0, -0.55, 0] })
  const shelfGeo = new THREE.CylinderGeometry(1, 1, 0.14, 14)
  for (let i = 0; i < 3; i++) {
    const y = -0.1 + i * 0.5
    add(g, shelfGeo, matSoft(i === 1 ? a : b), { p: [0.4, y, 0], r: [0, 0, -0.35], s: [1, 0.6, 0.75] })
  }
  add(g, new THREE.CylinderGeometry(0.72, 0.72, 0.16, 12), matSoft(a), { p: [0.5, 0.95, 0], r: [0, 0, -0.3] })
  return g
}

function budding([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.8, 14, 12), matSoft(a), { s: [1, 1.15, 1] })
  add(g, new THREE.SphereGeometry(0.45, 12, 10), matSoft(a), { p: [0.85, 0.6, 0.1] })
  add(g, new THREE.SphereGeometry(0.24, 10, 8), matSoft(b), { p: [1.25, 1.05, 0.15] })
  add(g, new THREE.SphereGeometry(0.5, 12, 10), matSoft(b), { p: [-0.75, -0.55, -0.2] })
  return g
}

function moldBrush([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.09, 0.11, 1.7, 8), matSoft(b), { p: [0, -0.35, 0] })
  const armGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.55, 6)
  const tipGeo = new THREE.SphereGeometry(0.13, 8, 8)
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2
    const x = Math.cos(ang) * 0.3, z = Math.sin(ang) * 0.3
    add(g, armGeo, matSoft(b), { p: [x * 0.8, 0.72, z * 0.8], r: [Math.sin(ang) * 0.5, 0, -Math.cos(ang) * 0.5] })
    for (let j = 0; j < 3; j++)
      add(g, tipGeo, matSoft(a), { p: [x * (1.1 + j * 0.12), 1.05 + j * 0.22, z * (1.1 + j * 0.12)] })
  }
  return g
}

function stalk([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.3, 10, 8), mat(INK), { p: [-0.45, -0.85, 0], s: [1.5, 0.8, 0.9] })
  add(g, new THREE.SphereGeometry(0.22, 10, 8), mat(INK), { p: [0.15, -0.8, 0] })
  add(g, curveTube([
    new THREE.Vector3(0.15, -0.7, 0),
    new THREE.Vector3(0.3, -0.1, 0.05),
    new THREE.Vector3(0.15, 0.55, -0.05),
    new THREE.Vector3(0.3, 1.1, 0),
  ], 0.08), matSoft(a))
  add(g, new THREE.CapsuleGeometry(0.2, 0.35, 6, 10), matSoft(b), { p: [0.32, 1.25, 0] })
  return g
}

function truffle([a, b]) {
  const g = new THREE.Group()
  const geo = new THREE.DodecahedronGeometry(0.95, 1)
  const pos = geo.getAttribute('position')
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    v.multiplyScalar(1 + 0.2 * Math.sin(v.x * 5.2) * Math.cos(v.y * 4.4))
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  add(g, geo, matSoft(a, { roughness: 0.9 }))
  const wartGeo = new THREE.ConeGeometry(0.12, 0.14, 5)
  for (let i = 0; i < 16; i++) {
    const dir = new THREE.Vector3().setFromSphericalCoords(1, Math.acos(1 - 2 * ((i + 0.5) / 16)), i * 2.4)
    const wart = add(g, wartGeo, matSoft(b, { roughness: 0.9 }), { p: dir.clone().multiplyScalar(0.98).toArray() })
    wart.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  }
  return g
}

function coral([a, b]) {
  const g = new THREE.Group()
  const branch = (x0, z0, dir, h, rad) => {
    const pts = []
    for (let i = 0; i <= 4; i++) {
      pts.push(new THREE.Vector3(
        x0 + Math.sin(i * 0.8 + dir) * 0.12 + dir * i * 0.1,
        -1 + (i / 4) * h,
        z0 + Math.cos(i * 0.7 + dir) * 0.12
      ))
    }
    add(g, curveTube(pts, rad, 6, 16), matSoft(i % 2 ? b : a))
    add(g, new THREE.SphereGeometry(rad * 1.6, 8, 8), matSoft(b), { p: pts[4].toArray() })
  }
  branch(0, 0, 0, 2.3, 0.1)
  branch(-0.2, 0.1, -1.4, 1.7, 0.08)
  branch(0.15, -0.1, 1.2, 1.9, 0.08)
  branch(-0.05, 0.15, 2.6, 1.4, 0.07)
  add(g, new THREE.CylinderGeometry(0.55, 0.7, 0.3, 10), matSoft('#8a6d3b'), { p: [0, -1.15, 0] })
  return g
}

/* ── plants ───────────────────────────────────────────────── */

function tree([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.16, 0.26, 1.4, 8), matSoft(b), { p: [0, -0.7, 0] })
  add(g, new THREE.CylinderGeometry(0.07, 0.09, 0.6, 6), matSoft(b), { p: [0.35, -0.15, 0], r: [0, 0, -0.7] })
  add(g, new THREE.IcosahedronGeometry(0.75, 1), matSoft(a), { p: [0, 0.55, 0] })
  add(g, new THREE.IcosahedronGeometry(0.55, 1), matSoft(a), { p: [0.62, 0.25, 0.1] })
  add(g, new THREE.IcosahedronGeometry(0.5, 1), matSoft(a), { p: [-0.55, 0.3, -0.1] })
  add(g, new THREE.IcosahedronGeometry(0.45, 1), matSoft(a), { p: [0.1, 1.05, -0.15] })
  return g
}

function conifer([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.2, 0.34, 1.0, 8), matSoft(b), { p: [0, -1.1, 0] })
  add(g, new THREE.ConeGeometry(0.85, 1.1, 9), matSoft(a), { p: [0, -0.15, 0] })
  add(g, new THREE.ConeGeometry(0.68, 1.0, 9), matSoft(a), { p: [0, 0.55, 0] })
  add(g, new THREE.ConeGeometry(0.5, 0.9, 9), matSoft(a), { p: [0, 1.2, 0] })
  return g
}

function palm([a, b]) {
  const g = new THREE.Group()
  add(g, curveTube([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(0.12, -0.5, 0.04),
    new THREE.Vector3(0.3, 0.3, 0.08),
    new THREE.Vector3(0.15, 1.0, 0),
  ], 0.14, 7), matSoft(b))
  const frondGeo = new THREE.SphereGeometry(0.9, 10, 8)
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2
    add(g, frondGeo, matSoft(i % 2 ? b : a), {
      p: [0.15, 1.05, 0],
      s: [1.5, 0.16, 0.55],
      r: [Math.cos(ang) * 0.5, ang, Math.sin(ang) * 0.4],
    })
  }
  add(g, new THREE.SphereGeometry(0.18, 8, 8), matSoft(a), { p: [0.15, 1.02, 0] })
  return g
}

function flower([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8), matSoft('#3f9142'), { p: [0, -0.85, 0] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), matSoft('#3f9142'), { p: [0.28, -1.0, 0], s: [1.2, 0.25, 0.5], r: [0, 0, 0.5] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), matSoft('#3f9142'), { p: [-0.28, -0.7, 0], s: [1.2, 0.25, 0.5], r: [0, 0, -0.5] })
  add(g, new THREE.CylinderGeometry(0.34, 0.34, 0.14, 16), matSoft(b), { p: [0, 0.05, 0], r: [Math.PI / 2, 0, 0] })
  const petalGeo = new THREE.SphereGeometry(0.32, 8, 8)
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2
    add(g, petalGeo, matSoft(a), {
      p: [Math.cos(ang) * 0.62, 0.05 + Math.sin(ang) * 0.62, 0],
      s: [1.15, 0.4, 0.18],
      r: [0, 0, ang],
    })
  }
  return g
}

function tulip([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.055, 0.075, 1.7, 8), matSoft(b), { p: [0, -0.7, 0] })
  add(g, new THREE.SphereGeometry(0.4, 10, 8), matSoft(b), { p: [0.3, -1.05, 0], s: [1.3, 0.22, 0.5], r: [0, 0, 0.6] })
  add(g, new THREE.SphereGeometry(0.4, 10, 8), matSoft(b), { p: [-0.3, -0.85, 0], s: [1.3, 0.22, 0.5], r: [0, 0, -0.6] })
  add(g, new THREE.SphereGeometry(0.5, 12, 10), matSoft(a), { p: [0, 0.45, 0], s: [1, 1.25, 1] })
  const petalGeo = new THREE.SphereGeometry(0.28, 8, 8)
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2
    add(g, petalGeo, matSoft(a), {
      p: [Math.cos(ang) * 0.36, 0.95, Math.sin(ang) * 0.36],
      s: [0.7, 1.3, 0.5],
      r: [Math.sin(ang) * 0.28, 0, -Math.cos(ang) * 0.28],
    })
  }
  return g
}

function flytrap([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.07, 0.1, 1.2, 8), matSoft(a), { p: [0, -0.85, 0], r: [0, 0, 0.12] })
  const lobeGeo = new THREE.SphereGeometry(0.7, 12, 10, 0, Math.PI)
  add(g, lobeGeo, matSoft(b), { p: [0, 0.1, 0.13], r: [0.5, 0, 0], s: [1, 1.15, 0.55] })
  add(g, lobeGeo, matSoft(b), { p: [0, 0.1, -0.13], r: [Math.PI - 0.5, 0, 0], s: [1, 1.15, 0.55] })
  const toothGeo = new THREE.ConeGeometry(0.05, 0.3, 5)
  for (let i = 0; i < 7; i++) {
    const x = -0.54 + i * 0.18
    const y = 0.75 + Math.cos((i - 3) * 0.4) * 0.12
    add(g, toothGeo, mat(a), { p: [x, y, 0.28], r: [0.7, 0, 0] })
    add(g, toothGeo, mat(a), { p: [x, y, -0.28], r: [-0.7, 0, 0] })
  }
  return g
}

function bamboo([a, b]) {
  const g = new THREE.Group()
  const seg = new THREE.CylinderGeometry(0.16, 0.16, 0.72, 10)
  const ring = new THREE.CylinderGeometry(0.19, 0.19, 0.07, 10)
  const culm = (x, h, lean) => {
    for (let i = 0; i < h; i++) {
      add(g, seg, matSoft(a), { p: [x + i * lean * 0.1, -1 + i * 0.8, 0], r: [0, 0, lean] })
      add(g, ring, matSoft(b), { p: [x + i * lean * 0.1, -0.6 + i * 0.8, 0], r: [0, 0, lean] })
    }
    const leafGeo = new THREE.SphereGeometry(0.3, 8, 6)
    add(g, leafGeo, matSoft(b), { p: [x + h * lean * 0.1 + 0.3, -1.15 + h * 0.8, 0], s: [1.4, 0.2, 0.4], r: [0, 0, 0.45] })
    add(g, leafGeo, matSoft(b), { p: [x + h * lean * 0.1 - 0.28, -1.3 + h * 0.8, 0.1], s: [1.3, 0.18, 0.4], r: [0, 0, -0.5] })
  }
  culm(-0.55, 3, 0.05)
  culm(0.2, 4, -0.03)
  culm(0.85, 2, 0.1)
  return g
}

function grass([a, b]) {
  const g = new THREE.Group()
  const bladeGeo = new THREE.SphereGeometry(0.5, 8, 6)
  for (let i = -4; i <= 4; i++) {
    const x = i * 0.26, lean = (i % 2 ? 0.4 : -0.35) + i * 0.05
    add(g, bladeGeo, matSoft(i % 2 ? b : a), {
      p: [x, -0.7 + Math.abs(i) * 0.08, 0],
      s: [0.24, 1.6 - Math.abs(i) * 0.12, 0.5],
      r: [0.12, 0, lean],
    })
  }
  return g
}

function fern([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.05, 0.07, 1.7, 8), matSoft(b), { p: [0, -0.35, 0], r: [0.1, 0, 0] })
  const frondGeo = new THREE.SphereGeometry(0.32, 8, 6)
  for (let i = 0; i < 8; i++) {
    const y = -0.2 + i * 0.24
    const s = 1 - i * 0.08
    add(g, frondGeo, matSoft(a), { p: [0.34, y, 0], s: [1.2 * s, 0.22 * s, 0.4], r: [0, 0, -0.75] })
    add(g, frondGeo, matSoft(a), { p: [-0.34, y, 0], s: [1.2 * s, 0.22 * s, 0.4], r: [0, 0, 0.75] })
  }
  return g
}

function moss([a, b]) {
  const g = new THREE.Group()
  const cushion = new THREE.SphereGeometry(0.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2)
  add(g, cushion, matSoft(a), { p: [0, -0.5, 0], s: [1.2, 0.7, 1] })
  const puffGeo = new THREE.SphereGeometry(0.22, 8, 6)
  for (let i = 0; i < 14; i++) {
    const ang = i * 2.5, rad = 0.5 + (i % 3) * 0.2
    add(g, puffGeo, matSoft(i % 2 ? b : a), {
      p: [Math.cos(ang) * rad * 0.9, -0.28 + (i % 4) * 0.12, Math.sin(ang) * rad * 0.7],
      s: [1, 0.7, 1],
    })
  }
  return g
}

function lichen([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(1.0, 1.1, 0.14, 14), matSoft(a), { p: [0, -0.35, 0] })
  const cupGeo = new THREE.CylinderGeometry(0.2, 0.12, 0.22, 8)
  for (let i = 0; i < 8; i++) {
    const ang = i * 1.1, rad = 0.55 + (i % 3) * 0.15
    add(g, cupGeo, matSoft(i % 2 ? b : a), {
      p: [Math.cos(ang) * rad, -0.2, Math.sin(ang) * rad * 0.8],
      r: [Math.cos(ang) * 0.1, 0, Math.sin(ang) * 0.1],
    })
  }
  return g
}

function kelp([a, b]) {
  const g = new THREE.Group()
  const frond = (x0, phase, h) => {
    const pts = []
    for (let i = 0; i <= 6; i++)
      pts.push(new THREE.Vector3(x0 + Math.sin(i * 1.1 + phase) * 0.22, -1.1 + (i / 6) * h, Math.cos(i * 0.9 + phase) * 0.12))
    add(g, curveTube(pts, 0.07, 6, 30), matSoft(b))
    add(g, new THREE.SphereGeometry(0.14, 8, 8), matSoft(a), { p: pts[6].toArray() })
    const leafGeo = new THREE.SphereGeometry(0.3, 8, 8)
    for (let i = 2; i <= 5; i++)
      add(g, leafGeo, matSoft(a), { p: pts[i].clone().add(new THREE.Vector3(0.2, 0, 0)).toArray(), s: [1.1, 0.28, 0.5], r: [0, 0, 0.5] })
  }
  frond(-0.5, 0, 2.3)
  frond(0.15, 2.1, 2.05)
  frond(0.7, 4.2, 1.7)
  add(g, new THREE.CylinderGeometry(0.5, 0.62, 0.24, 10), matSoft('#8a6d3b'), { p: [0.1, -1.2, 0] })
  return g
}

function cactus([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.42, 1.6, 6, 12), matSoft(a))
  add(g, new THREE.CapsuleGeometry(0.24, 0.5, 6, 10), matSoft(a), { p: [-0.72, 0.05, 0], r: [0, 0, 0.9] })
  add(g, new THREE.CapsuleGeometry(0.24, 0.55, 6, 10), matSoft(a), { p: [-0.95, 0.6, 0] })
  add(g, new THREE.CapsuleGeometry(0.22, 0.4, 6, 10), matSoft(a), { p: [0.68, -0.25, 0], r: [0, 0, -0.9] })
  add(g, new THREE.CapsuleGeometry(0.22, 0.45, 6, 10), matSoft(a), { p: [0.88, 0.25, 0] })
  add(g, new THREE.SphereGeometry(0.18, 8, 8), matSoft(b), { p: [0, 1.05, 0], s: [1, 0.8, 1] })
  return g
}

/* ── animals: mammals ─────────────────────────────────────── */

function bigcat([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.45, 1.05, 6, 12), matSoft(a), { p: [0, 0, 0], r: [0, 0, Math.PI / 2] })
  const head = add(g, new THREE.SphereGeometry(0.42, 12, 10), matSoft(a), { p: [0.95, 0.42, 0] })
  add(g, new THREE.SphereGeometry(0.16, 8, 8), matSoft(a), { p: [0.82, 0.82, 0.22] })
  add(g, new THREE.SphereGeometry(0.16, 8, 8), matSoft(a), { p: [0.82, 0.82, -0.22] })
  add(g, new THREE.SphereGeometry(0.13, 8, 8), mat('#fff'), { p: [1.3, 0.32, 0], s: [1, 0.8, 1.1] })
  eyes(g, 1.22, 0.52, 0, 0.18, 0.9)
  const legGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.75, 8)
  ;[[0.62, 0.28], [0.62, -0.28], [-0.62, 0.28], [-0.62, -0.28]].forEach(([x, z]) =>
    add(g, legGeo, matSoft(a), { p: [x, -0.7, z] })
  )
  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.05, 0.1, 0),
    new THREE.Vector3(-1.5, 0.45, 0.1),
    new THREE.Vector3(-1.7, 0.9, 0),
  ])
  add(g, new THREE.TubeGeometry(tail, 16, 0.08, 6), matSoft(a))
  const stripeGeo = new THREE.TorusGeometry(0.47, 0.05, 6, 14, Math.PI)
  for (let i = 0; i < 4; i++)
    add(g, stripeGeo, matSoft(b), { p: [-0.55 + i * 0.38, 0.05, 0], r: [0, Math.PI / 2, Math.PI], s: 0.98 })
  head.renderOrder = 1
  return g
}

function quadruped([a, b], { ears = 0.16, snout = 0.13, horns = null, hump = 0, neckUp = 0, tailUp = 0.3, tailLen = 0.6, trunk = false, bulk = 1 } = {}) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.5 * bulk, 1.15 * bulk, 6, 12), matSoft(a), { p: [0, 0.05 + hump * 0.2, 0], r: [0, 0, Math.PI / 2], s: [1, 1 + hump * 0.35, 0.95] })
  const head = add(g, new THREE.SphereGeometry(0.42, 12, 10), matSoft(a), { p: [1.05, 0.5 + neckUp, 0] })
  if (trunk) {
    add(g, curveTube([
      new THREE.Vector3(1.3, 0.45, 0),
      new THREE.Vector3(1.65, 0.1, 0),
      new THREE.Vector3(1.7, -0.35, 0.05),
    ], 0.1, 6, 14), matSoft(a))
  } else if (snout) {
    add(g, new THREE.SphereGeometry(snout, 8, 8), matSoft(b), { p: [1.42, 0.42, 0], s: [1.2, 0.9, 0.9] })
  }
  add(g, new THREE.SphereGeometry(ears, 8, 8), matSoft(a), { p: [0.95, 0.92, 0.24] })
  add(g, new THREE.SphereGeometry(ears, 8, 8), matSoft(a), { p: [0.95, 0.92, -0.24] })
  if (horns) {
    const hornGeo = new THREE.ConeGeometry(0.07, horns[0], 6)
    for (const dx of [-1, 1]) add(g, hornGeo, matSoft(b), { p: [1.0, 0.95 + horns[1], dx * 0.3], r: [0, 0, dx * -0.25] })
  }
  eyes(g, 1.32, 0.58 + neckUp, 0, 0.22, 0.95)
  const legGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.8, 8)
  ;[[0.66, 0.32], [0.66, -0.32], [-0.66, 0.32], [-0.66, -0.32]].forEach(([x, z]) =>
    add(g, legGeo, matSoft(a), { p: [x, -0.68, z] })
  )
  if (tailLen > 0) {
    add(g, curveTube([
      new THREE.Vector3(-1.15, 0.15, 0),
      new THREE.Vector3(-1.45 - tailLen * 0.5, 0.2 + tailUp, 0),
      new THREE.Vector3(-1.5 - tailLen * 0.8, 0.1 + tailUp * 1.4, 0.05),
    ], 0.07, 6, 12), matSoft(b))
  }
  head.renderOrder = 1
  return g
}

function bear([a, b]) { return quadruped([a, b], { ears: 0.18, snout: 0.16, bulk: 1.25, tailLen: 0.12, tailUp: 0.1 }) }
function canid([a, b]) { return quadruped([a, b], { ears: 0.22, snout: 0.16, tailLen: 0.7, tailUp: 0.8 }) }
function deer([a, b]) { return quadruped([a, b], { ears: 0.2, snout: 0.12, horns: [0.5, 0.1], tailLen: 0.2 }) }
function bovid([a, b]) { return quadruped([a, b], { horns: [0.45, 0.05], tailLen: 0.45, tailUp: -0.1 }) }
function pig([a, b]) { return quadruped([a, b], { ears: 0.14, snout: 0.2, bulk: 1.15, tailLen: 0.3 }) }
function equid([a, b]) { return quadruped([a, b], { ears: 0.2, snout: 0.14, neckUp: 0.15, tailLen: 0.7, tailUp: -0.5 }) }
function camelid([a, b]) { return quadruped([a, b], { ears: 0.15, snout: 0.13, hump: 0.55, neckUp: 0.3, tailLen: 0.4 }) }
function rhino([a, b]) { return quadruped([a, b], { ears: 0.18, snout: 0.1, horns: [0.32, 0], bulk: 1.35, tailLen: 0.4 }) }
function hippo([a, b]) { return quadruped([a, b], { ears: 0.12, snout: 0.24, bulk: 1.4, tailLen: 0.25 }) }
function tapir([a, b]) { return quadruped([a, b], { ears: 0.14, snout: 0.15, trunk: true, tailLen: 0.15 }) }
function giraffe([a, b]) { const g = quadruped([a, b], { ears: 0.16, snout: 0.1, neckUp: 0.9, horns: [0.18, 0.02], tailLen: 0.7, tailUp: -0.2 }); g.scale.setScalar(0.82); return g }
function elephant([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.85, 14, 12), matSoft(a), { s: [1.35, 1, 1] })
  add(g, new THREE.SphereGeometry(0.52, 12, 10), matSoft(a), { p: [1.15, 0.5, 0] })
  const earGeo = new THREE.SphereGeometry(0.42, 10, 8)
  add(g, earGeo, matSoft(b), { p: [1.0, 0.62, 0.5], s: [0.8, 1.1, 0.18], r: [0.25, 0.35, 0] })
  add(g, earGeo, matSoft(b), { p: [1.0, 0.62, -0.5], s: [0.8, 1.1, 0.18], r: [-0.25, -0.35, 0] })
  const trunk = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.55, 0.45, 0),
    new THREE.Vector3(1.85, 0.05, 0),
    new THREE.Vector3(1.85, -0.45, 0.06),
    new THREE.Vector3(2.0, -0.75, 0),
  ])
  add(g, new THREE.TubeGeometry(trunk, 20, 0.14, 8), matSoft(a))
  const tuskGeo = new THREE.ConeGeometry(0.06, 0.4, 6)
  add(g, tuskGeo, mat('#fff', { roughness: 0.4 }), { p: [1.6, 0.1, 0.25], r: [0.3, 0, -2.4] })
  add(g, tuskGeo, mat('#fff', { roughness: 0.4 }), { p: [1.6, 0.1, -0.25], r: [-0.3, 0, -2.4] })
  eyes(g, 1.42, 0.68, 0, 0.3, 0.9)
  const legGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.8, 8)
  ;[[0.7, 0.4], [0.7, -0.4], [-0.7, 0.4], [-0.7, -0.4]].forEach(([x, z]) =>
    add(g, legGeo, matSoft(a), { p: [x, -1.05, z] })
  )
  g.scale.setScalar(0.82)
  return g
}

function whale([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.85, 16, 12), matSoft(a), { s: [1.9, 0.85, 0.9] })
  add(g, new THREE.SphereGeometry(0.8, 14, 10), matSoft(b), { p: [0.12, -0.2, 0], s: [1.75, 0.72, 0.86] })
  const tail = add(g, new THREE.SphereGeometry(0.4, 10, 8), matSoft(a), { p: [-1.75, 0.15, 0], s: [0.9, 0.22, 1.6], r: [0, 0, 0.25] })
  tail.rotation.x = 0.15
  const finGeo = new THREE.SphereGeometry(0.3, 8, 8)
  add(g, finGeo, matSoft(a), { p: [0.45, -0.45, 0.72], s: [1.2, 0.25, 0.6], r: [0.5, -0.4, 0] })
  add(g, finGeo, matSoft(a), { p: [0.45, -0.45, -0.72], s: [1.2, 0.25, 0.6], r: [-0.5, 0.4, 0] })
  eyes(g, 1.15, 0.05, 0, 0.55, 1)
  add(g, new THREE.SphereGeometry(0.1, 6, 6), mat('#bae6fd', { transparent: true, opacity: 0.8 }), { p: [0.55, 0.85, 0] })
  add(g, new THREE.SphereGeometry(0.07, 6, 6), mat('#bae6fd', { transparent: true, opacity: 0.8 }), { p: [0.45, 1.05, 0.1] })
  add(g, new THREE.SphereGeometry(0.07, 6, 6), mat('#bae6fd', { transparent: true, opacity: 0.8 }), { p: [0.68, 1.05, -0.08] })
  g.scale.setScalar(0.9)
  return g
}

function dolphin([a, b]) {
  const g = whale([a, b])
  g.add(new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 8), matSoft(b)))
  g.children[g.children.length - 1].position.set(1.6, 0.02, 0)
  g.children[g.children.length - 1].rotation.z = -Math.PI / 2
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 4), matSoft(a))
  fin.position.set(-0.1, 0.65, 0)
  fin.rotation.z = -0.35
  fin.scale.set(1, 1, 0.4)
  g.add(fin)
  return g
}

function seal([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.7, 14, 12), matSoft(a), { s: [1.9, 0.8, 0.85], r: [0, 0, -0.15] })
  add(g, new THREE.SphereGeometry(0.38, 12, 10), matSoft(b), { p: [1.45, 0.3, 0] })
  add(g, new THREE.SphereGeometry(0.16, 8, 8), mat(INK), { p: [1.72, 0.34, 0.06] })
  eyes(g, 1.7, 0.42, 0.1, 0.2, 0.9)
  const flipGeo = new THREE.SphereGeometry(0.34, 8, 8)
  add(g, flipGeo, matSoft(b), { p: [0.7, -0.45, 0.72], s: [1.3, 0.2, 0.55], r: [0.2, -0.5, 0] })
  add(g, flipGeo, matSoft(b), { p: [0.7, -0.45, -0.72], s: [1.3, 0.2, 0.55], r: [-0.2, 0.5, 0] })
  add(g, flipGeo, matSoft(b), { p: [-1.4, -0.2, 0], s: [0.9, 0.2, 1.5], r: [0, 0, 0.3] })
  return g
}

function primate([a, b], { tail = false, muzzle = 0 } = {}) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.36, 14, 12), matSoft(b), { p: [0, 1.02, 0] })
  if (muzzle) add(g, new THREE.SphereGeometry(0.18, 10, 8), matSoft(b), { p: [0, 0.88, 0.26], s: [1, 0.8, 0.9] })
  eyes(g, 0, 1.08, 0.3, 0.13, 0.8)
  add(g, new THREE.SphereGeometry(0.16, 8, 8), matSoft(a), { p: [0.24, 1.28, 0.1], s: [0.6, 0.9, 0.5], r: [0, 0, 0.3] })
  add(g, new THREE.SphereGeometry(0.16, 8, 8), matSoft(a), { p: [-0.24, 1.28, 0.1], s: [0.6, 0.9, 0.5], r: [0, 0, -0.3] })
  add(g, new THREE.CapsuleGeometry(0.4, 0.7, 6, 12), matSoft(a), { p: [0, 0.02, 0] })
  const armGeo = new THREE.CapsuleGeometry(0.11, 0.62, 4, 8)
  add(g, armGeo, matSoft(a), { p: [0.52, 0.12, 0], r: [0, 0, 0.55] })
  add(g, armGeo, matSoft(a), { p: [-0.52, 0.12, 0], r: [0, 0, -0.55] })
  add(g, new THREE.SphereGeometry(0.12, 8, 8), matSoft(b), { p: [0.78, -0.28, 0] })
  add(g, new THREE.SphereGeometry(0.12, 8, 8), matSoft(b), { p: [-0.78, -0.28, 0] })
  const legGeo = new THREE.CapsuleGeometry(0.13, 0.6, 4, 8)
  add(g, legGeo, matSoft(a), { p: [0.2, -0.85, 0] })
  add(g, legGeo, matSoft(a), { p: [-0.2, -0.85, 0] })
  if (tail) {
    add(g, curveTube([
      new THREE.Vector3(0, -1.0, -0.2),
      new THREE.Vector3(0, -1.35, -0.4),
      new THREE.Vector3(0.05, -1.7, -0.5),
    ], 0.07, 6, 12), matSoft(b))
  }
  return g
}

function hedgehog([a, b]) {
  const g = new THREE.Group()
  const dome = new THREE.SphereGeometry(0.8, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2)
  add(g, dome, matSoft(a), { p: [0, -0.3, 0], s: [1.15, 0.9, 1] })
  const spikeGeo = new THREE.ConeGeometry(0.045, 0.4, 5)
  for (let i = 0; i < 40; i++) {
    const ang = i * 2.4, rad = 0.55 + (i % 4) * 0.1
    add(g, spikeGeo, matSoft(b), {
      p: [Math.cos(ang) * rad, -0.1 + (i % 3) * 0.1, Math.sin(ang) * rad * 0.8],
      r: [Math.cos(ang) * 0.6, 0, -Math.sin(ang) * 0.6],
    })
  }
  add(g, new THREE.SphereGeometry(0.3, 10, 8), matSoft(b), { p: [1.0, -0.35, 0] })
  eyes(g, 1.2, -0.22, 0, 0.16, 0.8)
  return g
}

function bat([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.5, 12, 10), matSoft(a), { s: [1, 1.1, 0.9] })
  add(g, new THREE.SphereGeometry(0.34, 10, 8), matSoft(b), { p: [0, 0.58, 0] })
  eyes(g, 0.12, 0.68, 0.3, 0.16, 0.8)
  const earGeo = new THREE.ConeGeometry(0.12, 0.3, 6)
  add(g, earGeo, matSoft(b), { p: [0.14, 0.98, 0], r: [0, 0, -0.2] })
  add(g, earGeo, matSoft(b), { p: [-0.14, 0.98, 0], r: [0, 0, 0.2] })
  const wingGeo = new THREE.SphereGeometry(0.6, 10, 8)
  add(g, wingGeo, matSoft(a, { side: THREE.DoubleSide }), { p: [0.55, 0.1, 0.1], s: [1.6, 0.14, 0.9], r: [0, -0.4, 0.4] })
  add(g, wingGeo, matSoft(a, { side: THREE.DoubleSide }), { p: [-0.55, 0.1, 0.1], s: [1.6, 0.14, 0.9], r: [0, 0.4, -0.4] })
  return g
}

function kangaroo([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.72, 14, 12), matSoft(a), { p: [0, -0.25, 0], s: [0.95, 1.2, 0.85], r: [0, 0, -0.25] })
  add(g, new THREE.SphereGeometry(0.5, 12, 10), matSoft(b), { p: [0.12, -0.35, 0.2], s: [0.7, 0.95, 0.6], r: [0, 0, -0.2] })
  add(g, new THREE.SphereGeometry(0.34, 12, 10), matSoft(a), { p: [0.55, 0.95, 0], s: [1.15, 0.95, 0.85] })
  add(g, new THREE.ConeGeometry(0.1, 0.28, 6), matSoft(b), { p: [0.92, 0.88, 0], r: [0, 0, -Math.PI / 2] })
  const earGeo = new THREE.SphereGeometry(0.16, 8, 8)
  add(g, earGeo, matSoft(a), { p: [0.42, 1.35, 0.18], s: [0.6, 1.5, 0.4], r: [0.2, 0, -0.15] })
  add(g, earGeo, matSoft(a), { p: [0.42, 1.35, -0.18], s: [0.6, 1.5, 0.4], r: [-0.2, 0, -0.15] })
  eyes(g, 0.72, 1.05, 0, 0.2, 0.9)
  const thighGeo = new THREE.SphereGeometry(0.42, 10, 8)
  add(g, thighGeo, matSoft(a), { p: [-0.15, -0.75, 0.5], s: [1.2, 0.9, 0.6] })
  add(g, thighGeo, matSoft(a), { p: [-0.15, -0.75, -0.5], s: [1.2, 0.9, 0.6] })
  const footGeo = new THREE.SphereGeometry(0.22, 8, 6)
  add(g, footGeo, matSoft(b), { p: [0.35, -1.15, 0.5], s: [1.9, 0.4, 0.7] })
  add(g, footGeo, matSoft(b), { p: [0.35, -1.15, -0.5], s: [1.9, 0.4, 0.7] })
  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 6)
  add(g, armGeo, matSoft(a), { p: [0.45, 0.25, 0.25], r: [0, 0, 0.6] })
  add(g, armGeo, matSoft(a), { p: [0.45, 0.25, -0.25], r: [0, 0, 0.6] })
  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, -0.7, 0),
    new THREE.Vector3(-1.15, -1.05, 0),
    new THREE.Vector3(-1.7, -1.1, 0),
  ])
  add(g, new THREE.TubeGeometry(tail, 14, 0.16, 8), matSoft(a))
  g.position.y = 0.15
  g.scale.setScalar(0.9)
  return g
}

/* ── animals: birds ───────────────────────────────────────── */

function bird([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.62, 14, 12), matSoft(a), { s: [1.5, 0.95, 0.85], r: [0, 0, 0.3] })
  add(g, new THREE.SphereGeometry(0.4, 12, 10), matSoft(b), { p: [0.75, 0.65, 0] })
  add(g, new THREE.ConeGeometry(0.12, 0.4, 6), matSoft('#f59e0b'), { p: [1.18, 0.6, 0], r: [0, 0, -Math.PI / 2] })
  eyes(g, 0.95, 0.78, 0, 0.24, 1)
  const wingGeo = new THREE.SphereGeometry(0.55, 10, 8)
  add(g, wingGeo, matSoft(a), { p: [-0.15, 0.35, 0.55], s: [1.5, 0.25, 0.6], r: [0.45, -0.5, -0.35] })
  add(g, wingGeo, matSoft(a), { p: [-0.15, 0.35, -0.55], s: [1.5, 0.25, 0.6], r: [-0.45, 0.5, -0.35] })
  add(g, new THREE.SphereGeometry(0.35, 8, 8), matSoft(b), { p: [-1.05, -0.15, 0], s: [1.4, 0.3, 0.7], r: [0, 0, 0.5] })
  return g
}

function owl([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.72, 14, 12), matSoft(a), { s: [0.95, 1.3, 0.9] })
  add(g, new THREE.SphereGeometry(0.5, 12, 10), matSoft(b), { p: [0, 0.28, 0.32], s: [0.85, 0.95, 0.6] })
  const eyeRingGeo = new THREE.TorusGeometry(0.2, 0.06, 8, 14)
  add(g, eyeRingGeo, matSoft(b), { p: [0.2, 0.62, 0.4], r: [0.2, 0, 0] })
  add(g, eyeRingGeo, matSoft(b), { p: [-0.2, 0.62, 0.4], r: [0.2, 0, 0] })
  eyes(g, 0, 0.62, 0.48, 0.2, 1.15)
  add(g, new THREE.ConeGeometry(0.07, 0.22, 6), matSoft('#f59e0b'), { p: [0, 0.85, 0.5], r: [Math.PI / 2, 0, 0] })
  const earGeo = new THREE.ConeGeometry(0.1, 0.28, 6)
  add(g, earGeo, matSoft(a), { p: [0.26, 1.2, 0], r: [0, 0, 0.3] })
  add(g, earGeo, matSoft(a), { p: [-0.26, 1.2, 0], r: [0, 0, -0.3] })
  const wingGeo = new THREE.SphereGeometry(0.5, 10, 8)
  add(g, wingGeo, matSoft(a), { p: [0.58, -0.1, 0], s: [0.5, 1.3, 0.65], r: [0, 0, -0.3] })
  add(g, wingGeo, matSoft(a), { p: [-0.58, -0.1, 0], s: [0.5, 1.3, 0.65], r: [0, 0, 0.3] })
  return g
}

function duck([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.62, 14, 12), matSoft(a), { s: [1.6, 0.95, 0.9], r: [0, 0, 0.25] })
  add(g, new THREE.SphereGeometry(0.4, 12, 10), matSoft(b), { p: [0.85, 0.6, 0] })
  add(g, new THREE.BoxGeometry(0.16, 0.09, 0.42), matSoft('#f59e0b'), { p: [1.32, 0.5, 0] })
  eyes(g, 1.05, 0.72, 0, 0.26, 1)
  const wingGeo = new THREE.SphereGeometry(0.5, 10, 8)
  add(g, wingGeo, matSoft(b), { p: [-0.1, 0.15, 0.55], s: [1.4, 0.22, 0.55], r: [0.4, -0.5, -0.3] })
  add(g, wingGeo, matSoft(b), { p: [-0.1, 0.15, -0.55], s: [1.4, 0.22, 0.55], r: [-0.4, 0.5, -0.3] })
  add(g, new THREE.SphereGeometry(0.3, 8, 8), matSoft(b), { p: [-1.0, -0.1, 0.1], s: [0.8, 0.28, 0.5], r: [0, 0, 0.7] })
  return g
}

function penguin([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.75, 14, 12), matSoft(a), { s: [0.9, 1.35, 0.85] })
  add(g, new THREE.SphereGeometry(0.6, 12, 10), mat('#fff'), { p: [0, -0.12, 0.28], s: [0.75, 1.05, 0.6] })
  add(g, new THREE.SphereGeometry(0.42, 12, 10), matSoft(a), { p: [0, 1.05, 0] })
  add(g, new THREE.SphereGeometry(0.18, 8, 8), matSoft(b), { p: [0, 0.82, 0.3], s: [1.2, 0.8, 0.8] })
  add(g, new THREE.ConeGeometry(0.09, 0.3, 6), matSoft('#f59e0b'), { p: [0, 1.0, 0.48], r: [Math.PI / 2, 0, 0] })
  eyes(g, 0, 1.15, 0.34, 0.17, 1)
  const flipGeo = new THREE.SphereGeometry(0.4, 8, 8)
  add(g, flipGeo, matSoft(a), { p: [0.72, 0.1, 0], s: [0.25, 1.1, 0.5], r: [0, 0, -0.35] })
  add(g, flipGeo, matSoft(a), { p: [-0.72, 0.1, 0], s: [0.25, 1.1, 0.5], r: [0, 0, 0.35] })
  const footGeo = new THREE.SphereGeometry(0.2, 8, 6)
  add(g, footGeo, matSoft('#f59e0b'), { p: [0.26, -1.05, 0.2], s: [0.8, 0.35, 1.4] })
  add(g, footGeo, matSoft('#f59e0b'), { p: [-0.26, -1.05, 0.2], s: [0.8, 0.35, 1.4] })
  return g
}

function ratite([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.8, 14, 12), matSoft(a), { p: [0, -0.55, 0], s: [0.95, 1.35, 0.8], r: [0.1, 0, 0] })
  add(g, new THREE.SphereGeometry(0.34, 12, 10), matSoft(a), { p: [0.1, 0.95, 0] })
  add(g, new THREE.SphereGeometry(0.16, 8, 8), matSoft(b), { p: [0.18, 1.32, 0] })
  add(g, new THREE.ConeGeometry(0.05, 0.22, 6), matSoft('#f59e0b'), { p: [0.16, 1.3, 0.16], r: [Math.PI / 2, 0, 0] })
  eyes(g, 0.28, 1.36, 0.05, 0.1, 0.7)
  const wingGeo = new THREE.SphereGeometry(0.5, 10, 8)
  add(g, wingGeo, matSoft(b), { p: [0.6, -0.25, 0], s: [0.4, 1.3, 0.55], r: [0, 0, -0.2] })
  add(g, wingGeo, matSoft(b), { p: [-0.6, -0.25, 0], s: [0.4, 1.3, 0.55], r: [0, 0, 0.2] })
  const legGeo = new THREE.CylinderGeometry(0.09, 0.07, 1.1, 8)
  add(g, legGeo, matSoft(b), { p: [0.3, -1.45, 0] })
  add(g, legGeo, matSoft(b), { p: [-0.3, -1.45, 0] })
  const footGeo = new THREE.SphereGeometry(0.18, 8, 6)
  add(g, footGeo, matSoft('#f59e0b'), { p: [0.42, -1.95, 0], s: [1.2, 0.4, 1.1] })
  add(g, footGeo, matSoft('#f59e0b'), { p: [-0.18, -1.95, 0], s: [1.2, 0.4, 1.1] })
  return g
}

/* ── animals: fish & marine ───────────────────────────────── */

function shark([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.75, 16, 12), matSoft(a), { s: [2.1, 0.75, 0.7] })
  add(g, new THREE.SphereGeometry(0.7, 14, 10), matSoft(b), { p: [0.1, -0.18, 0], s: [1.95, 0.62, 0.66] })
  add(g, new THREE.ConeGeometry(0.42, 0.75, 4), matSoft(a), { p: [-0.1, 0.72, 0], r: [0, 0, 0.12], s: [1, 1, 0.4] })
  const tailGeo = new THREE.ConeGeometry(0.3, 0.9, 4)
  add(g, tailGeo, matSoft(a), { p: [-1.7, 0.35, 0], r: [0, 0, -0.6], s: [1, 1, 0.35] })
  add(g, tailGeo, matSoft(a), { p: [-1.72, -0.25, 0], r: [0, 0, Math.PI + 0.7], s: [0.8, 0.8, 0.35] })
  const finGeo = new THREE.ConeGeometry(0.22, 0.6, 4)
  add(g, finGeo, matSoft(a), { p: [0.35, -0.4, 0.55], r: [1.9, 0, 0.4], s: [1, 1, 0.4] })
  add(g, finGeo, matSoft(a), { p: [0.35, -0.4, -0.55], r: [-1.9, 0, 0.4], s: [1, 1, 0.4] })
  eyes(g, 1.25, 0.12, 0, 0.42, 1)
  g.scale.setScalar(0.92)
  return g
}

function fish([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.6, 14, 12), matSoft(a), { s: [1.9, 0.85, 0.55] })
  const tailGeo = new THREE.ConeGeometry(0.34, 0.7, 4)
  add(g, tailGeo, matSoft(b), { p: [-1.45, 0.1, 0], r: [0, 0, Math.PI / 2], s: [1, 1, 0.5] })
  add(g, new THREE.ConeGeometry(0.2, 0.5, 4), matSoft(a), { p: [0.1, 0.55, 0], r: [0, 0, 0.2], s: [1, 1, 0.35] })
  const finGeo = new THREE.ConeGeometry(0.16, 0.42, 4)
  add(g, finGeo, matSoft(a), { p: [-0.2, -0.35, 0.4], r: [1.7, 0, 0.3], s: [1, 1, 0.4] })
  add(g, finGeo, matSoft(a), { p: [-0.2, -0.35, -0.4], r: [-1.7, 0, 0.3], s: [1, 1, 0.4] })
  eyes(g, 0.95, 0.05, 0, 0.34, 0.95)
  g.scale.setScalar(0.95)
  return g
}

function eel([a, b]) {
  const g = new THREE.Group()
  const pts = []
  for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector3(-1.7 + i * 0.34, Math.sin(i * 0.65) * 0.42, Math.cos(i * 0.4) * 0.1))
  add(g, curveTube(pts, 0.16, 7, 40), matSoft(a))
  add(g, new THREE.SphereGeometry(0.2, 10, 8), matSoft(b), { p: pts[10].toArray() })
  eyes(g, pts[10].x + 0.08, pts[10].y + 0.14, pts[10].z + 0.1, 0.1, 0.7)
  const finGeo = new THREE.SphereGeometry(0.5, 8, 6)
  add(g, finGeo, matSoft(b), { p: [0, -0.2, 0.08], s: [1.6, 0.12, 0.5], r: [0, 0, 0] })
  return g
}

function seahorse([a, b]) {
  const g = new THREE.Group()
  const pts = [
    new THREE.Vector3(0, -1.0, 0),
    new THREE.Vector3(0, -0.3, 0.05),
    new THREE.Vector3(0.12, 0.4, 0.1),
    new THREE.Vector3(0.28, 0.85, 0),
    new THREE.Vector3(0.05, 1.25, -0.05),
    new THREE.Vector3(-0.25, 1.05, -0.1),
  ]
  add(g, curveTube(pts, 0.17, 7, 36), matSoft(a))
  add(g, new THREE.SphereGeometry(0.24, 10, 8), matSoft(b), { p: [0.05, 1.32, -0.04], s: [1.1, 0.9, 0.8] })
  add(g, new THREE.ConeGeometry(0.045, 0.4, 6), matSoft(b), { p: [0.3, 1.3, 0.02], r: [0, 0, Math.PI / 2.2] })
  eyes(g, 0.02, 1.4, 0.16, 0.12, 0.8)
  const finGeo = new THREE.SphereGeometry(0.3, 8, 6)
  add(g, finGeo, matSoft(b), { p: [-0.25, 0.3, 0.15], s: [0.8, 0.35, 0.16], r: [0, 0.5, 0.4] })
  return g
}

function ray([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.95, 16, 12), matSoft(a), { s: [1.15, 0.16, 1.25], r: [0, 0, 0] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), matSoft(b), { p: [0.85, 0.08, 0] })
  eyes(g, 0.9, 0.16, 0.16, 0.1, 0.8)
  add(g, curveTube([
    new THREE.Vector3(-0.9, 0, 0),
    new THREE.Vector3(-1.5, 0.05, 0.02),
    new THREE.Vector3(-2.0, 0.12, 0),
  ], 0.07, 6, 14), matSoft(a))
  const finGeo = new THREE.SphereGeometry(0.5, 8, 8)
  add(g, finGeo, matSoft(a), { p: [0, 0, 0.95], s: [1.5, 0.14, 0.6], r: [0, 0, 0.3] })
  add(g, finGeo, matSoft(a), { p: [0, 0, -0.95], s: [1.5, 0.14, 0.6], r: [0, 0, -0.3] })
  return g
}

/* ── animals: herps ───────────────────────────────────────── */

function frog([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.75, 14, 12), matSoft(a), { p: [0, -0.1, 0], s: [1.15, 0.85, 1] })
  const eyeBase = new THREE.SphereGeometry(0.24, 10, 8)
  add(g, eyeBase, matSoft(a), { p: [0.35, 0.55, 0.32] })
  add(g, eyeBase, matSoft(a), { p: [0.35, 0.55, -0.32] })
  eyes(g, 0.47, 0.62, 0, 0.36, 1.3)
  const spotGeo = new THREE.SphereGeometry(0.13, 8, 6)
  ;[[-0.3, 0.35, 0.45], [-0.55, 0.1, -0.4], [0.1, 0.42, -0.3], [-0.1, 0.3, 0.55]].forEach((p) =>
    add(g, spotGeo, matSoft(b), { p, s: [1, 0.4, 1] })
  )
  const legGeo = new THREE.SphereGeometry(0.32, 10, 8)
  add(g, legGeo, matSoft(b), { p: [-0.55, -0.55, 0.62], s: [1.3, 0.55, 0.7], r: [0, 0.5, 0] })
  add(g, legGeo, matSoft(b), { p: [-0.55, -0.55, -0.62], s: [1.3, 0.55, 0.7], r: [0, -0.5, 0] })
  const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.5, 6)
  add(g, armGeo, matSoft(a), { p: [0.6, -0.55, 0.35], r: [0, 0, -0.2] })
  add(g, armGeo, matSoft(a), { p: [0.6, -0.55, -0.35], r: [0, 0, -0.2] })
  g.scale.setScalar(0.95)
  return g
}

function lizard([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.55, 14, 12), matSoft(a), { s: [1.9, 0.75, 0.9], r: [0, 0, 0] })
  add(g, new THREE.SphereGeometry(0.3, 12, 10), matSoft(b), { p: [1.15, 0.35, 0], s: [1.2, 0.9, 0.8] })
  eyes(g, 1.32, 0.5, 0, 0.18, 0.85)
  add(g, curveTube([
    new THREE.Vector3(-1.0, 0, 0),
    new THREE.Vector3(-1.5, 0.15, 0.05),
    new THREE.Vector3(-2.0, 0.35, 0),
  ], 0.11, 6, 16), matSoft(a))
  const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.5, 6)
  for (const dx of [-1, 1]) {
    add(g, legGeo, matSoft(b), { p: [dx * 0.5, -0.4, 0.35], r: [0.2, 0, dx * -0.5] })
    add(g, legGeo, matSoft(b), { p: [dx * 0.5, -0.4, -0.35], r: [-0.2, 0, dx * -0.5] })
  }
  return g
}

function snake([a, b]) {
  const g = new THREE.Group()
  const pts = []
  for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector3(-1.6 + i * 0.32, Math.sin(i * 1.15) * 0.4, Math.cos(i * 0.5) * 0.12))
  add(g, curveTube(pts, 0.2, 8, 44), matSoft(a))
  const head = new THREE.SphereGeometry(0.26, 12, 10)
  const h = add(g, head, matSoft(a), { p: pts[10].toArray(), s: [1.1, 0.8, 0.8] })
  h.rotation.z = -0.2
  eyes(g, pts[10].x + 0.1, pts[10].y + 0.16, pts[10].z + 0.16, 0.12, 0.8)
  const tongue = new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4)
  add(g, tongue, mat('#dc2626'), { p: [pts[10].x + 0.34, pts[10].y + 0.06, pts[10].z], r: [0, 0, Math.PI / 2] })
  return g
}

function croc([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.6, 14, 12), matSoft(a), { s: [2.3, 0.7, 0.75] })
  add(g, new THREE.BoxGeometry(0.9, 0.26, 0.5), matSoft(a), { p: [1.7, 0.25, 0] })
  const jaw = new THREE.BoxGeometry(0.9, 0.16, 0.44)
  add(g, jaw, matSoft(b), { p: [1.7, 0.1, 0], r: [0.08, 0, 0] })
  eyes(g, 1.95, 0.4, 0, 0.24, 1)
  add(g, curveTube([
    new THREE.Vector3(-1.4, 0.1, 0),
    new THREE.Vector3(-2.0, 0.25, 0.03),
    new THREE.Vector3(-2.5, 0.45, 0),
  ], 0.13, 7, 18), matSoft(a))
  const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.45, 8)
  for (const dx of [-1, 1]) {
    add(g, legGeo, matSoft(b), { p: [dx * 0.9, -0.5, 0.35], r: [0, 0, dx * -0.4] })
    add(g, legGeo, matSoft(b), { p: [dx * 0.9, -0.5, -0.35], r: [0, 0, dx * -0.4] })
  }
  const spikeGeo = new THREE.ConeGeometry(0.09, 0.22, 4)
  for (let i = 0; i < 6; i++) {
    const x = -1.1 + i * 0.38
    add(g, spikeGeo, matSoft(b), { p: [x, 0.42, 0], r: [0, 0, 0.2] })
  }
  g.scale.setScalar(0.85)
  return g
}

function turtle([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), matSoft(b), { p: [0, -0.05, 0], s: [1.15, 0.75, 1] })
  add(g, new THREE.CylinderGeometry(1.02, 1.08, 0.16, 16), matSoft(b), { p: [0, -0.08, 0] })
  const scuteGeo = new THREE.SphereGeometry(0.2, 6, 6)
  ;[[0, 0.55, 0], [0.45, 0.4, 0.3], [-0.45, 0.4, 0.3], [0.45, 0.4, -0.3], [-0.45, 0.4, -0.3]].forEach((p) =>
    add(g, scuteGeo, matSoft(a), { p, s: [1.2, 0.5, 1.2] })
  )
  add(g, new THREE.SphereGeometry(0.32, 10, 8), matSoft(a), { p: [1.25, -0.05, 0], s: [1.2, 1, 0.9] })
  eyes(g, 1.42, 0.12, 0, 0.2, 0.9)
  const finGeo = new THREE.SphereGeometry(0.35, 8, 8)
  add(g, finGeo, matSoft(a), { p: [0.7, -0.25, 0.85], s: [1.3, 0.3, 0.6], r: [0, -0.6, 0] })
  add(g, finGeo, matSoft(a), { p: [0.7, -0.25, -0.85], s: [1.3, 0.3, 0.6], r: [0, 0.6, 0] })
  add(g, finGeo, matSoft(a), { p: [-0.75, -0.25, 0.8], s: [1.1, 0.28, 0.55], r: [0, 0.6, 0] })
  add(g, finGeo, matSoft(a), { p: [-0.75, -0.25, -0.8], s: [1.1, 0.28, 0.55], r: [0, -0.6, 0] })
  g.scale.setScalar(0.85)
  return g
}

/* ── animals: bugs & inverts ──────────────────────────────── */

function butterfly([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.14, 0.85, 6, 10), matSoft(b))
  add(g, new THREE.SphereGeometry(0.18, 10, 8), matSoft(b), { p: [0, 0.62, 0] })
  const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4)
  add(g, antGeo, matSoft(b), { p: [0.1, 0.92, 0.05], r: [0, 0, -0.5] })
  add(g, antGeo, matSoft(b), { p: [-0.1, 0.92, 0.05], r: [0, 0, 0.5] })
  const wingGeo = new THREE.SphereGeometry(0.5, 10, 8)
  const wing = (sx, top) =>
    add(g, wingGeo, matSoft(a, { side: THREE.DoubleSide }), {
      p: [sx * (top ? 0.62 : 0.5), top ? 0.35 : -0.32, -0.05],
      s: top ? [1.25, 0.85, 0.1] : [0.95, 0.7, 0.1],
      r: [0.15, 0, sx * (top ? 0.5 : -0.35)],
    })
  wing(1, true); wing(-1, true); wing(1, false); wing(-1, false)
  const dotGeo = new THREE.SphereGeometry(0.07, 6, 6)
  ;[[0.9, 0.55], [-0.9, 0.55], [0.7, -0.45], [-0.7, -0.45]].forEach(([x, y]) =>
    add(g, dotGeo, mat('#fff'), { p: [x, y, 0.02], s: [1, 1, 0.3] })
  )
  g.rotation.x = -0.35
  return g
}

function bee([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.62, 14, 12), matSoft(a), { s: [1.45, 1, 1] })
  const stripeGeo = new THREE.TorusGeometry(0.58, 0.1, 8, 18)
  add(g, stripeGeo, matSoft(b), { p: [-0.25, 0, 0], r: [0, Math.PI / 2, 0] })
  add(g, stripeGeo, matSoft(b), { p: [0.15, 0, 0], r: [0, Math.PI / 2, 0], s: [0.98, 0.98, 1] })
  add(g, new THREE.SphereGeometry(0.34, 10, 8), matSoft(b), { p: [0.95, 0.1, 0] })
  add(g, new THREE.ConeGeometry(0.1, 0.35, 6), matSoft(b), { p: [-1.0, 0, 0], r: [0, 0, Math.PI / 2] })
  eyes(g, 1.18, 0.2, 0, 0.2, 1.1)
  const wingGeo = new THREE.SphereGeometry(0.42, 8, 8)
  const wingMat = mat('#dbeafe', { transparent: true, opacity: 0.7, side: THREE.DoubleSide })
  add(g, wingGeo, wingMat, { p: [0.1, 0.62, 0.35], s: [1.15, 0.12, 0.55], r: [0.35, -0.3, 0] })
  add(g, wingGeo, wingMat, { p: [0.1, 0.62, -0.35], s: [1.15, 0.12, 0.55], r: [-0.35, 0.3, 0] })
  return g
}

function beetle([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.65, 14, 12), matShiny(a), { s: [1.15, 0.8, 0.9] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), matSoft(b), { p: [0.85, 0.1, 0] })
  add(g, new THREE.SphereGeometry(0.12, 8, 8), matShiny(a), { p: [0.85, -0.25, 0], s: [1.3, 0.9, 0.9] })
  eyes(g, 0.95, 0.22, 0.22, 0.14, 0.8)
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5)
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
    add(g, legGeo, matSoft(b), { p: [dx * 0.4, -0.4, dz * 0.42], r: [0.3, 0, dx * -0.4] })
    add(g, legGeo, matSoft(b), { p: [dx * 0.05, -0.45, dz * 0.5], r: [-0.2, 0, dx * -0.2] })
  }
  return g
}

function ant([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.42, 12, 10), matSoft(a), { p: [-0.55, 0, 0], s: [1, 0.9, 0.85] })
  add(g, new THREE.SphereGeometry(0.28, 10, 8), matSoft(b), { p: [0.05, 0.02, 0] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), matSoft(a), { p: [0.55, 0.05, 0], s: [1.1, 0.9, 0.85] })
  eyes(g, 0.7, 0.14, 0.18, 0.1, 0.7)
  const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4)
  add(g, antGeo, matSoft(b), { p: [0.66, 0.3, 0.1], r: [0, 0, -0.4] })
  add(g, antGeo, matSoft(b), { p: [0.6, 0.32, -0.12], r: [0, 0, -0.6] })
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.55, 4)
  for (const dx of [-1, 1]) {
    add(g, legGeo, matSoft(a), { p: [dx * 0.2, -0.25, 0.3], r: [0, 0, dx * -0.3] })
    add(g, legGeo, matSoft(a), { p: [dx * 0.2, -0.25, -0.3], r: [0, 0, dx * -0.3] })
    add(g, legGeo, matSoft(a), { p: [dx * 0.1, -0.28, 0], r: [0, 0, dx * -0.15] })
  }
  return g
}

function hopper([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.55, 14, 12), matSoft(a), { s: [2.1, 0.8, 0.75], r: [0, 0, 0.25] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), matSoft(b), { p: [1.25, 0.35, 0] })
  eyes(g, 1.42, 0.5, 0, 0.14, 0.9)
  const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4)
  add(g, antGeo, matSoft(b), { p: [1.5, 0.62, 0.05], r: [0, 0, -0.5] })
  add(g, antGeo, matSoft(b), { p: [1.48, 0.64, -0.05], r: [0, 0, -0.7] })
  const thighGeo = new THREE.CapsuleGeometry(0.2, 0.5, 4, 8)
  add(g, thighGeo, matSoft(a), { p: [-0.55, -0.15, 0], r: [0, 0, Math.PI / 3] })
  add(g, new THREE.CapsuleGeometry(0.11, 0.55, 4, 8), matSoft(b), { p: [-0.95, -0.55, 0], r: [0, 0, -Math.PI / 4] })
  return g
}

function mantis([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.22, 1.1, 6, 10), matSoft(a), { p: [0, -0.15, 0], r: [0.15, 0, 0] })
  add(g, new THREE.SphereGeometry(0.26, 10, 8), matSoft(b), { p: [0.15, 1.25, 0], s: [1, 0.85, 0.8] })
  eyes(g, 0.1, 1.4, 0.18, 0.16, 1.1)
  const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4)
  add(g, antGeo, matSoft(b), { p: [0.12, 1.5, 0.1], r: [0, 0, -0.5] })
  add(g, antGeo, matSoft(b), { p: [0.14, 1.52, -0.1], r: [0, 0, -0.7] })
  const armGeo = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8)
  add(g, armGeo, matSoft(b), { p: [0.1, 0.6, 0.18], r: [1.2, 0, 0.3] })
  add(g, armGeo, matSoft(b), { p: [0.1, 0.6, -0.18], r: [1.2, 0, -0.3] })
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 5)
  for (const dz of [-1, 1]) {
    add(g, legGeo, matSoft(b), { p: [0, -0.7, dz * 0.2], r: [0.4, 0, dz * -0.4] })
    add(g, legGeo, matSoft(b), { p: [0.15, -0.65, dz * 0.28], r: [-0.3, 0, dz * -0.4] })
  }
  return g
}

function dragonfly([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.13, 1.1, 6, 10), matShiny(b))
  add(g, new THREE.SphereGeometry(0.2, 10, 8), matShiny(a), { p: [0, 0.75, 0] })
  eyes(g, 0.1, 0.82, 0.14, 0.12, 1.1)
  const wingGeo = new THREE.SphereGeometry(0.6, 8, 6)
  const wingMat = mat('#dbeafe', { transparent: true, opacity: 0.75, side: THREE.DoubleSide })
  add(g, wingGeo, wingMat, { p: [0.5, 0.25, 0.05], s: [1.7, 0.14, 0.6], r: [0, 0.4, 0.2] })
  add(g, wingGeo, wingMat, { p: [0.4, -0.15, 0.05], s: [1.55, 0.12, 0.55], r: [0, 0.4, 0.1] })
  add(g, wingGeo, wingMat, { p: [-0.5, 0.25, 0.05], s: [1.7, 0.14, 0.6], r: [0, -0.4, -0.2] })
  add(g, wingGeo, wingMat, { p: [-0.4, -0.15, 0.05], s: [1.55, 0.12, 0.55], r: [0, -0.4, -0.1] })
  return g
}

function spider([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.5, 14, 12), matSoft(a), { s: [1.3, 1, 0.9] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), matSoft(b), { p: [0.85, 0.1, 0] })
  eyes(g, 1.02, 0.14, 0.16, 0.1, 0.8)
  const legGeo = new THREE.CylinderGeometry(0.035, 0.03, 1.3, 6)
  for (const dx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const z = -0.45 + i * 0.3
      add(g, legGeo, matSoft(b), { p: [dx * 0.4, -0.3, z], r: [Math.PI / 2.2, 0, dx * -0.9] })
    }
  }
  return g
}

function scorpion([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.45, 12, 10), matSoft(a), { s: [1.4, 0.8, 0.8] })
  add(g, new THREE.SphereGeometry(0.32, 10, 8), matSoft(b), { p: [0.95, 0.15, 0] })
  const clawGeo = new THREE.CapsuleGeometry(0.14, 0.3, 4, 8)
  add(g, clawGeo, matSoft(b), { p: [1.05, 0.3, 0.3], r: [0, 0, -0.7] })
  add(g, clawGeo, matSoft(b), { p: [1.05, 0.3, -0.3], r: [0, 0, -0.7] })
  add(g, curveTube([
    new THREE.Vector3(-0.55, 0.05, 0),
    new THREE.Vector3(-0.95, 0.3, 0),
    new THREE.Vector3(-1.25, 0.7, 0.05),
    new THREE.Vector3(-1.35, 1.1, 0),
  ], 0.1, 6, 20), matSoft(a))
  add(g, new THREE.SphereGeometry(0.14, 8, 8), mat('#dc2626'), { p: [-1.35, 1.16, 0] })
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 5)
  for (const dz of [-1, 1]) {
    add(g, legGeo, matSoft(b), { p: [0.3, -0.3, dz * 0.35], r: [0.3, 0, dz * -0.5] })
    add(g, legGeo, matSoft(b), { p: [-0.1, -0.3, dz * 0.4], r: [0.3, 0, dz * -0.5] })
    add(g, legGeo, matSoft(b), { p: [-0.45, -0.3, dz * 0.35], r: [0.3, 0, dz * -0.5] })
  }
  return g
}

function crab([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.62, 14, 12), matShiny(a), { s: [1.6, 0.6, 1.1] })
  add(g, new THREE.SphereGeometry(0.16, 8, 8), matSoft(b), { p: [1.25, 0.15, 0], s: [1.4, 1, 1] })
  const eyeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 6)
  add(g, eyeGeo, matSoft(b), { p: [1.3, 0.35, 0.18] })
  add(g, eyeGeo, matSoft(b), { p: [1.3, 0.35, -0.18] })
  add(g, new THREE.SphereGeometry(0.07, 8, 8), mat(INK), { p: [1.3, 0.5, 0.18] })
  add(g, new THREE.SphereGeometry(0.07, 8, 8), mat(INK), { p: [1.3, 0.5, -0.18] })
  const clawGeo = new THREE.SphereGeometry(0.24, 10, 8)
  for (const dz of [-1, 1]) {
    add(g, new THREE.CapsuleGeometry(0.12, 0.5, 4, 8), matShiny(b), { p: [1.15, -0.05, dz * 0.7], r: [0, 0, dz * 0.8] })
    add(g, clawGeo, matShiny(b), { p: [1.55, -0.05, dz * 0.95], s: [1.3, 1, 0.8] })
  }
  const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6)
  for (const dz of [-1, 1]) {
    add(g, legGeo, matShiny(a), { p: [0.35, -0.35, dz * 0.85], r: [0, 0, dz * -0.6] })
    add(g, legGeo, matShiny(a), { p: [-0.35, -0.35, dz * 0.85], r: [0, 0, dz * -0.6] })
  }
  return g
}

function shrimp([a, b]) {
  const g = new THREE.Group()
  const pts = []
  for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(-1.1 + i * 0.28, Math.sin(i * 0.7) * 0.28, 0))
  add(g, curveTube(pts, 0.16, 7, 34), matSoft(a))
  add(g, new THREE.SphereGeometry(0.2, 10, 8), matSoft(b), { p: pts[8].toArray() })
  add(g, new THREE.ConeGeometry(0.045, 0.5, 5), matSoft(b), { p: [pts[8].x + 0.2, pts[8].y + 0.15, 0], r: [0, 0, -0.3] })
  eyes(g, pts[8].x + 0.06, pts[8].y + 0.24, 0.12, 0.1, 0.8)
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 4)
  for (let i = 1; i <= 5; i++) {
    add(g, legGeo, matSoft(b), { p: [pts[i].x, pts[i].y - 0.2, 0.1], r: [0.2, 0, 0.3] })
    add(g, legGeo, matSoft(b), { p: [pts[i].x, pts[i].y - 0.2, -0.1], r: [-0.2, 0, 0.3] })
  }
  add(g, new THREE.SphereGeometry(0.3, 8, 6), matSoft(b), { p: [pts[2].x, pts[2].y - 0.05, 0], s: [0.5, 0.14, 0.8] })
  return g
}

function snail([a, b]) {
  const g = new THREE.Group()
  const shell = new THREE.Group()
  const coilGeo = new THREE.TorusGeometry(0.42, 0.16, 8, 18)
  for (let i = 0; i < 4; i++) {
    const s = 1 - i * 0.22
    add(shell, coilGeo, matShiny(i % 2 ? b : a), { p: [0, 0, i * 0.14], s, r: [Math.PI / 2, 0, 0] })
  }
  add(shell, new THREE.SphereGeometry(0.4, 12, 10), matShiny(a), { p: [0, 0, 0.45], s: [1, 1, 0.9] })
  shell.position.set(0.35, 0.2, 0)
  shell.rotation.z = 0.2
  g.add(shell)
  add(g, new THREE.CapsuleGeometry(0.3, 0.9, 6, 10), matSoft(b), { p: [-0.35, -0.55, 0], r: [0, 0, Math.PI / 2] })
  add(g, new THREE.SphereGeometry(0.24, 10, 8), matSoft(b), { p: [-1.0, -0.35, 0] })
  const eyeStalk = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5)
  add(g, eyeStalk, matSoft(b), { p: [-1.1, -0.1, 0.1], r: [0.5, 0, 0] })
  add(g, eyeStalk, matSoft(b), { p: [-1.1, -0.1, -0.1], r: [-0.5, 0, 0] })
  add(g, new THREE.SphereGeometry(0.05, 8, 8), mat(INK), { p: [-1.16, 0.02, 0.12] })
  add(g, new THREE.SphereGeometry(0.05, 8, 8), mat(INK), { p: [-1.16, 0.02, -0.12] })
  return g
}

function slug([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.42, 1.4, 6, 12), matSoft(a), { r: [0, 0, Math.PI / 2] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), matSoft(b), { p: [1.2, 0.15, 0] })
  const tentGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.32, 5)
  add(g, tentGeo, matSoft(b), { p: [1.4, 0.4, 0.08], r: [0.4, 0, 0] })
  add(g, tentGeo, matSoft(b), { p: [1.4, 0.4, -0.08], r: [-0.4, 0, 0] })
  const dotGeo = new THREE.SphereGeometry(0.08, 8, 6)
  for (let i = 0; i < 6; i++) add(g, dotGeo, matSoft(b), { p: [-0.8 + i * 0.35, 0.42, 0], s: [1, 0.6, 1] })
  return g
}

function bivalve([a, b]) {
  const g = new THREE.Group()
  const shellGeo = new THREE.SphereGeometry(0.75, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2)
  const top = add(g, shellGeo, matShiny(a), { p: [0, 0.06, 0], r: [-0.18, 0, 0], s: [1, 0.55, 1.25] })
  const bottom = add(g, shellGeo, matShiny(b), { p: [0, -0.08, 0], r: [Math.PI + 0.18, 0, 0], s: [1, 0.5, 1.25] })
  bottom.rotation.y = 0
  top.castShadow = true
  const ridgeGeo = new THREE.TorusGeometry(0.7, 0.02, 6, 24, Math.PI)
  for (let i = 0; i < 4; i++) {
    add(g, ridgeGeo, matSoft(b), { p: [0, 0.04 + i * 0.09, 0], r: [-0.18 + i * 0.05, 0, 0], s: 1 - i * 0.13 })
  }
  return g
}

function octopus([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.75, 14, 12), matSoft(a), { p: [0, 0.55, 0], s: [1, 1.15, 1] })
  eyes(g, 0, 0.62, 0.68, 0.3, 1.6)
  const m = matSoft(a)
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + 0.2
    const r0 = 0.45
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(ang) * r0, -0.1, Math.sin(ang) * r0),
      new THREE.Vector3(Math.cos(ang) * (r0 + 0.35), -0.7, Math.sin(ang) * (r0 + 0.35)),
      new THREE.Vector3(Math.cos(ang) * (r0 + 0.75), -0.95, Math.sin(ang) * (r0 + 0.75)),
      new THREE.Vector3(Math.cos(ang) * (r0 + 1.0), -0.55 + (i % 2) * 0.15, Math.sin(ang) * (r0 + 1.0)),
    ])
    add(g, new THREE.TubeGeometry(curve, 20, 0.11, 7), m)
    add(g, new THREE.SphereGeometry(0.11, 8, 8), matSoft(b), { p: curve.getPoint(1).toArray() })
  }
  g.scale.setScalar(0.85)
  g.position.y = 0.1
  return g
}

function squid([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.6, 14, 12), matSoft(a), { p: [0, 0.55, 0], s: [1, 1.5, 1] })
  const finGeo = new THREE.SphereGeometry(0.4, 8, 8)
  add(g, finGeo, matSoft(b), { p: [0.45, 1.35, 0], s: [0.7, 0.2, 0.7], r: [0, 0, 0.5] })
  add(g, finGeo, matSoft(b), { p: [-0.45, 1.35, 0], s: [0.7, 0.2, 0.7], r: [0, 0, -0.5] })
  eyes(g, 0, 0.3, 0.55, 0.24, 1.5)
  const m = matSoft(a)
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(ang) * 0.3, -0.35, Math.sin(ang) * 0.3),
      new THREE.Vector3(Math.cos(ang) * 0.45, -0.95, Math.sin(ang) * 0.45),
      new THREE.Vector3(Math.cos(ang) * 0.6, -1.45, Math.sin(ang) * 0.6),
    ])
    add(g, new THREE.TubeGeometry(curve, 14, 0.07, 6), m)
  }
  add(g, new THREE.SphereGeometry(0.24, 10, 8), matSoft(b), { p: [0, 0.42, 0] })
  return g
}

function nautilus([a, b]) {
  const g = new THREE.Group()
  const pts = []
  for (let i = 0; i <= 40; i++) {
    const t = i * 0.13
    const rad = 0.18 * Math.exp(0.42 * t)
    pts.push(new THREE.Vector3(Math.cos(t) * rad, 0, Math.sin(t) * rad))
  }
  add(g, curveTube(pts, 0.16, 8, 60), matShiny(a))
  add(g, new THREE.SphereGeometry(0.5, 12, 10), matShiny(b), { p: [0.5, 0, 0], s: [1, 0.8, 0.8] })
  return g
}

/* ── animals: cnidaria & other marine ─────────────────────── */

function jellyfish([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.85, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(a, { transparent: true, opacity: 0.85 }), { p: [0, -0.1, 0], s: [1, 0.85, 1] })
  const m = mat(b, { transparent: true, opacity: 0.9 })
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(ang) * 0.55, -0.25, Math.sin(ang) * 0.55),
      new THREE.Vector3(Math.cos(ang) * 0.6, -0.9, Math.sin(ang) * 0.6),
      new THREE.Vector3(Math.cos(ang) * 0.5, -1.5, Math.sin(ang) * 0.5),
    ])
    add(g, new THREE.TubeGeometry(curve, 16, 0.045, 6), m)
  }
  return g
}

function anemone([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.5, 0.68, 0.8, 12), matSoft(a), { p: [0, -0.5, 0] })
  const tentGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.8, 6)
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2
    add(g, tentGeo, matSoft(i % 2 ? b : a), {
      p: [Math.cos(ang) * 0.45, 0, Math.sin(ang) * 0.45],
      r: [Math.cos(ang) * 0.7, 0, -Math.sin(ang) * 0.7],
    })
  }
  const dotGeo = new THREE.SphereGeometry(0.09, 8, 8)
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2
    add(g, dotGeo, matSoft(b), { p: [Math.cos(ang) * 0.78, 0.18, Math.sin(ang) * 0.78] })
  }
  return g
}

function starfish([a, b]) {
  const g = new THREE.Group()
  const armGeo = new THREE.CapsuleGeometry(0.2, 0.75, 5, 10)
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 - Math.PI / 2
    add(g, armGeo, matSoft(i % 2 ? b : a), {
      p: [Math.cos(ang) * 0.55, 0, Math.sin(ang) * 0.55],
      r: [0, -ang, Math.PI / 2],
      s: [1, 1, 0.5],
    })
  }
  add(g, new THREE.SphereGeometry(0.42, 10, 8), matSoft(a), { s: [1, 0.6, 1] })
  const dotGeo = new THREE.SphereGeometry(0.05, 6, 6)
  for (let i = 0; i < 8; i++) {
    const ang = i * 2.6, rad = 0.25
    add(g, dotGeo, matSoft(b), { p: [Math.cos(ang) * rad, 0.28, Math.sin(ang) * rad] })
  }
  return g
}

function sponge([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.6, 0.85, 1.5, 12), matSoft(a))
  const poreGeo = new THREE.TorusGeometry(0.09, 0.03, 6, 10)
  for (let i = 0; i < 8; i++) {
    const ang = i * 2.6, y = -0.5 + (i % 3) * 0.45
    add(g, poreGeo, matSoft(b), { p: [Math.cos(ang) * 0.55, y, Math.sin(ang) * 0.55], r: [0, -ang, 0] })
  }
  add(g, new THREE.CylinderGeometry(0.28, 0.34, 0.2, 10), matSoft(b), { p: [0, 0.8, 0] })
  return g
}

/* ── humans ───────────────────────────────────────────────── */

function human([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.36, 14, 12), matSoft(b), { p: [0, 1.05, 0] })
  add(g, new THREE.SphereGeometry(0.38, 12, 10), matSoft(INK), { p: [0, 1.18, -0.06], s: [1, 0.75, 1] })
  eyes(g, 0, 1.05, 0.32, 0.14, 0.7)
  add(g, new THREE.CapsuleGeometry(0.4, 0.7, 6, 12), matSoft(a), { p: [0, 0.05, 0] })
  const armGeo = new THREE.CapsuleGeometry(0.11, 0.62, 4, 8)
  add(g, armGeo, matSoft(a), { p: [0.52, 0.15, 0], r: [0, 0, 0.5] })
  add(g, armGeo, matSoft(a), { p: [-0.52, 0.15, 0], r: [0, 0, -0.5] })
  add(g, new THREE.SphereGeometry(0.12, 8, 8), matSoft(b), { p: [0.75, -0.28, 0] })
  add(g, new THREE.SphereGeometry(0.12, 8, 8), matSoft(b), { p: [-0.75, -0.28, 0] })
  const legGeo = new THREE.CapsuleGeometry(0.13, 0.7, 4, 8)
  add(g, legGeo, matSoft('#334155'), { p: [0.2, -0.95, 0] })
  add(g, legGeo, matSoft('#334155'), { p: [-0.2, -0.95, 0] })
  return g
}

/* ── registry ─────────────────────────────────────────────── */

const BUILDERS = {
  virus, phage, helixRod, coccus, chain, amoeba, ciliate, euglena, kelp,
  rod: (c) => rod(c),
  rodFlagella: (c) => rod(c, { flagella: 2 }),
  bullet, brick, twin, square, spiral, urchin, slimeMold, diatom, tardigrade, worm,
  mushroom, budding, moldBrush, stalk, truffle, shelf, coral,
  tree, conifer, palm, flower, tulip, flytrap, bamboo, grass, fern, moss, lichen, cactus,
  bigcat, bear, canid, deer, bovid, pig, equid, camelid, rhino, hippo, tapir, giraffe,
  quadruped, elephant, whale, dolphin, seal, primate, hedgehog, bat, kangaroo,
  bird, owl, duck, penguin, ratite,
  shark, fish, eel, seahorse, ray,
  frog, lizard, snake, croc, turtle,
  butterfly, bee, beetle, ant, hopper, mantis, dragonfly,
  spider, scorpion, crab, shrimp,
  snail, slug, bivalve, octopus, squid, nautilus,
  jellyfish, anemone, starfish, sponge,
  human,
}

export function buildSpecimen(model = {}) {
  const builder = BUILDERS[model.shape] || coccus
  const group = builder(model.colors || ['#7C3AED', '#F43F8E'])
  // normalize so every specimen fits the same camera framing
  const box = new THREE.Box3().setFromObject(group)
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const wrapper = new THREE.Group()
  wrapper.add(group)
  group.position.sub(sphere.center)
  wrapper.scale.setScalar(1.35 / (sphere.radius || 1))
  wrapper.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true
      obj.receiveShadow = true
    }
  })
  return wrapper
}

export function disposeObject(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      mats.forEach((m) => m.dispose())
    }
  })
}
