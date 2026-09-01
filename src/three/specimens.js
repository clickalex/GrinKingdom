// GrinKingdom — procedural 3D specimen kit.
// Every species gets a stylized low-poly "specimen" built from shared parts,
// so the whole encyclopedia scales without hand-modeling each organism.

import * as THREE from 'three'

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.05,
    flatShading: true,
    ...opts,
  })

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
  const m = mat(INK, { roughness: 0.3 })
  add(group, eyeGeo, m, { p: [x - spread, y, z], s: size })
  add(group, eyeGeo, m, { p: [x + spread, y, z], s: size })
}

/* ── microbes ─────────────────────────────────────────────── */

function virus([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.IcosahedronGeometry(0.85, 1), mat(a))
  const spikeGeo = new THREE.ConeGeometry(0.1, 0.42, 6)
  const knobGeo = new THREE.SphereGeometry(0.13, 8, 8)
  const dirs = new THREE.IcosahedronGeometry(1, 1).getAttribute('position')
  const seen = new Set()
  for (let i = 0; i < dirs.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(dirs, i).normalize()
    const key = v.toArray().map((n) => n.toFixed(2)).join(',')
    if (seen.has(key)) continue
    seen.add(key)
    const spike = add(g, spikeGeo, mat(b), { p: v.clone().multiplyScalar(1.0).toArray() })
    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v)
    add(g, knobGeo, mat(b), { p: v.clone().multiplyScalar(1.22).toArray() })
  }
  return g
}

function phage([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.IcosahedronGeometry(0.55, 0), mat(a), { p: [0, 0.85, 0] })
  add(g, new THREE.CylinderGeometry(0.13, 0.13, 1.1, 8), mat(b), { p: [0, 0.05, 0] })
  add(g, new THREE.CylinderGeometry(0.3, 0.42, 0.16, 6), mat(b), { p: [0, -0.52, 0] })
  const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.95, 6)
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2
    add(g, legGeo, mat(a), {
      p: [Math.cos(ang) * 0.55, -0.85, Math.sin(ang) * 0.55],
      r: [Math.sin(ang) * 0.75, 0, -Math.cos(ang) * 0.75],
    })
  }
  return g
}

function helixRod([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.3, 0.3, 2.2, 12), mat(a), { r: [0, 0, Math.PI / 2] })
  const diskGeo = new THREE.TorusGeometry(0.34, 0.09, 8, 18)
  for (let i = 0; i < 7; i++)
    add(g, diskGeo, mat(b), { p: [-0.99 + i * 0.33, 0, 0], r: [0, Math.PI / 2, 0] })
  return g
}

function rod([a, b], { flagella = 0 } = {}) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.5, 1.2, 6, 14), mat(a), { r: [0, 0, Math.PI / 2] })
  const dotGeo = new THREE.SphereGeometry(0.09, 8, 8)
  for (let i = 0; i < 8; i++) {
    const ang = i * 2.4
    add(g, dotGeo, mat(b), {
      p: [-0.7 + i * 0.2, Math.cos(ang) * 0.45, Math.sin(ang) * 0.45],
    })
  }
  if (flagella) {
    const curve = (flip) =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.05, 0, 0),
        new THREE.Vector3(1.45, 0.22 * flip, 0.1),
        new THREE.Vector3(1.8, -0.18 * flip, -0.12),
        new THREE.Vector3(2.15, 0.15 * flip, 0.08),
      ])
    add(g, new THREE.TubeGeometry(curve(1), 24, 0.045, 6), mat(b))
    add(g, new THREE.TubeGeometry(curve(-1), 24, 0.045, 6), mat(b))
    g.position.x = -0.35
  }
  return g
}

function coccus([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.IcosahedronGeometry(0.75, 1), mat(a))
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

function ciliate([a, b]) {
  const g = new THREE.Group()
  const body = add(g, new THREE.SphereGeometry(0.75, 16, 16), mat(a), { s: [1.6, 0.85, 0.7] })
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
  add(g, new THREE.SphereGeometry(0.7, 14, 14), mat(a), { s: [1.7, 0.62, 0.62] })
  add(g, new THREE.SphereGeometry(0.12, 8, 8), mat(b), { p: [1.0, 0.18, 0] })
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.15, 0, 0),
    new THREE.Vector3(1.6, 0.3, 0.1),
    new THREE.Vector3(2.0, -0.15, -0.1),
    new THREE.Vector3(2.35, 0.2, 0.05),
  ])
  add(g, new THREE.TubeGeometry(curve, 24, 0.04, 6), mat(a))
  g.position.x = -0.5
  return g
}

function kelp([a, b]) {
  const g = new THREE.Group()
  const frond = (x0, phase, h) => {
    const pts = []
    for (let i = 0; i <= 6; i++)
      pts.push(new THREE.Vector3(x0 + Math.sin(i * 1.1 + phase) * 0.22, -1.1 + (i / 6) * h, Math.cos(i * 0.9 + phase) * 0.12))
    const curve = new THREE.CatmullRomCurve3(pts)
    add(g, new THREE.TubeGeometry(curve, 30, 0.07, 6), mat(b))
    add(g, new THREE.SphereGeometry(0.14, 8, 8), mat(a), { p: pts[6].toArray() })
    const leafGeo = new THREE.SphereGeometry(0.3, 8, 8)
    for (let i = 2; i <= 5; i++)
      add(g, leafGeo, mat(a), { p: pts[i].clone().add(new THREE.Vector3(0.2, 0, 0)).toArray(), s: [1.1, 0.28, 0.5], r: [0, 0, 0.5] })
  }
  frond(-0.5, 0, 2.3)
  frond(0.15, 2.1, 2.05)
  frond(0.7, 4.2, 1.7)
  add(g, new THREE.CylinderGeometry(0.5, 0.62, 0.24, 10), mat('#8a6d3b'), { p: [0.1, -1.2, 0] })
  return g
}

/* ── fungi ────────────────────────────────────────────────── */

function mushroom([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.26, 0.36, 1.15, 10), mat('#f5efe0'), { p: [0, -0.45, 0] })
  add(g, new THREE.SphereGeometry(0.95, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(a), { p: [0, 0.1, 0], s: [1, 0.78, 1] })
  add(g, new THREE.CylinderGeometry(0.95, 0.95, 0.06, 18), mat('#e8ddc8'), { p: [0, 0.1, 0] })
  const spotGeo = new THREE.SphereGeometry(0.09, 8, 8)
  const spots = [[0, 0.82, 0.15], [0.45, 0.6, 0.35], [-0.5, 0.55, 0.3], [0.25, 0.62, -0.5], [-0.3, 0.6, -0.45], [0.6, 0.45, -0.1]]
  spots.forEach(([x, y, z]) => add(g, spotGeo, mat(b), { p: [x, y, z], s: [1, 0.5, 1] }))
  return g
}

function budding([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.8, 14, 12), mat(a), { s: [1, 1.15, 1] })
  add(g, new THREE.SphereGeometry(0.45, 12, 10), mat(a), { p: [0.85, 0.6, 0.1] })
  add(g, new THREE.SphereGeometry(0.24, 10, 8), mat(b), { p: [1.25, 1.05, 0.15] })
  add(g, new THREE.SphereGeometry(0.5, 12, 10), mat(b), { p: [-0.75, -0.55, -0.2] })
  return g
}

function moldBrush([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.09, 0.11, 1.7, 8), mat(b), { p: [0, -0.35, 0] })
  const armGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.55, 6)
  const tipGeo = new THREE.SphereGeometry(0.13, 8, 8)
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2
    const x = Math.cos(ang) * 0.3, z = Math.sin(ang) * 0.3
    add(g, armGeo, mat(b), { p: [x * 0.8, 0.72, z * 0.8], r: [Math.sin(ang) * 0.5, 0, -Math.cos(ang) * 0.5] })
    for (let j = 0; j < 3; j++)
      add(g, tipGeo, mat(a), { p: [x * (1.1 + j * 0.12), 1.05 + j * 0.22, z * (1.1 + j * 0.12)] })
  }
  return g
}

function stalk([a, b]) {
  const g = new THREE.Group()
  // the unlucky ant
  add(g, new THREE.SphereGeometry(0.3, 10, 8), mat(INK), { p: [-0.45, -0.85, 0], s: [1.5, 0.8, 0.9] })
  add(g, new THREE.SphereGeometry(0.22, 10, 8), mat(INK), { p: [0.15, -0.8, 0] })
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.15, -0.7, 0),
    new THREE.Vector3(0.3, -0.1, 0.05),
    new THREE.Vector3(0.15, 0.55, -0.05),
    new THREE.Vector3(0.3, 1.1, 0),
  ])
  add(g, new THREE.TubeGeometry(curve, 24, 0.08, 8), mat(a))
  add(g, new THREE.CapsuleGeometry(0.2, 0.35, 6, 10), mat(b), { p: [0.32, 1.25, 0] })
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
  add(g, geo, mat(a, { roughness: 0.9 }))
  const wartGeo = new THREE.ConeGeometry(0.12, 0.14, 5)
  for (let i = 0; i < 16; i++) {
    const dir = new THREE.Vector3().setFromSphericalCoords(1, Math.acos(1 - 2 * ((i + 0.5) / 16)), i * 2.4)
    const wart = add(g, wartGeo, mat(b, { roughness: 0.9 }), { p: dir.clone().multiplyScalar(0.98).toArray() })
    wart.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  }
  return g
}

/* ── plants ───────────────────────────────────────────────── */

function tree([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.16, 0.26, 1.4, 8), mat(b), { p: [0, -0.7, 0] })
  add(g, new THREE.CylinderGeometry(0.07, 0.09, 0.6, 6), mat(b), { p: [0.35, -0.15, 0], r: [0, 0, -0.7] })
  add(g, new THREE.IcosahedronGeometry(0.75, 1), mat(a), { p: [0, 0.55, 0] })
  add(g, new THREE.IcosahedronGeometry(0.55, 1), mat(a), { p: [0.62, 0.25, 0.1] })
  add(g, new THREE.IcosahedronGeometry(0.5, 1), mat(a), { p: [-0.55, 0.3, -0.1] })
  add(g, new THREE.IcosahedronGeometry(0.45, 1), mat(a), { p: [0.1, 1.05, -0.15] })
  return g
}

function conifer([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.2, 0.34, 1.0, 8), mat(b), { p: [0, -1.1, 0] })
  add(g, new THREE.ConeGeometry(0.85, 1.1, 9), mat(a), { p: [0, -0.15, 0] })
  add(g, new THREE.ConeGeometry(0.68, 1.0, 9), mat(a), { p: [0, 0.55, 0] })
  add(g, new THREE.ConeGeometry(0.5, 0.9, 9), mat(a), { p: [0, 1.2, 0] })
  return g
}

function flower([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8), mat('#3f9142'), { p: [0, -0.85, 0] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), mat('#3f9142'), { p: [0.28, -1.0, 0], s: [1.2, 0.25, 0.5], r: [0, 0, 0.5] })
  add(g, new THREE.SphereGeometry(0.3, 10, 8), mat('#3f9142'), { p: [-0.28, -0.7, 0], s: [1.2, 0.25, 0.5], r: [0, 0, -0.5] })
  add(g, new THREE.CylinderGeometry(0.34, 0.34, 0.14, 16), mat(b), { p: [0, 0.05, 0], r: [Math.PI / 2, 0, 0] })
  const petalGeo = new THREE.SphereGeometry(0.32, 8, 8)
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2
    add(g, petalGeo, mat(a), {
      p: [Math.cos(ang) * 0.62, 0.05 + Math.sin(ang) * 0.62, 0],
      s: [1.15, 0.4, 0.18],
      r: [0, 0, ang],
    })
  }
  return g
}

function tulip([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.055, 0.075, 1.7, 8), mat(b), { p: [0, -0.7, 0] })
  add(g, new THREE.SphereGeometry(0.4, 10, 8), mat(b), { p: [0.3, -1.05, 0], s: [1.3, 0.22, 0.5], r: [0, 0, 0.6] })
  add(g, new THREE.SphereGeometry(0.4, 10, 8), mat(b), { p: [-0.3, -0.85, 0], s: [1.3, 0.22, 0.5], r: [0, 0, -0.6] })
  add(g, new THREE.SphereGeometry(0.5, 12, 10), mat(a), { p: [0, 0.45, 0], s: [1, 1.25, 1] })
  const petalGeo = new THREE.SphereGeometry(0.28, 8, 8)
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2
    add(g, petalGeo, mat(a), {
      p: [Math.cos(ang) * 0.36, 0.95, Math.sin(ang) * 0.36],
      s: [0.7, 1.3, 0.5],
      r: [Math.sin(ang) * 0.28, 0, -Math.cos(ang) * 0.28],
    })
  }
  return g
}

function flytrap([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CylinderGeometry(0.07, 0.1, 1.2, 8), mat(a), { p: [0, -0.85, 0], r: [0, 0, 0.12] })
  const lobeGeo = new THREE.SphereGeometry(0.7, 12, 10, 0, Math.PI)
  add(g, lobeGeo, mat(b), { p: [0, 0.1, 0.13], r: [0.5, 0, 0], s: [1, 1.15, 0.55] })
  add(g, lobeGeo, mat(b), { p: [0, 0.1, -0.13], r: [Math.PI - 0.5, 0, 0], s: [1, 1.15, 0.55] })
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
      add(g, seg, mat(a), { p: [x + i * lean * 0.1, -1 + i * 0.8, 0], r: [0, 0, lean] })
      add(g, ring, mat(b), { p: [x + i * lean * 0.1, -0.6 + i * 0.8, 0], r: [0, 0, lean] })
    }
    const leafGeo = new THREE.SphereGeometry(0.3, 8, 6)
    add(g, leafGeo, mat(b), { p: [x + h * lean * 0.1 + 0.3, -1.15 + h * 0.8, 0], s: [1.4, 0.2, 0.4], r: [0, 0, 0.45] })
    add(g, leafGeo, mat(b), { p: [x + h * lean * 0.1 - 0.28, -1.3 + h * 0.8, 0.1], s: [1.3, 0.18, 0.4], r: [0, 0, -0.5] })
  }
  culm(-0.55, 3, 0.05)
  culm(0.2, 4, -0.03)
  culm(0.85, 2, 0.1)
  return g
}

function cactus([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.42, 1.6, 6, 12), mat(a))
  add(g, new THREE.CapsuleGeometry(0.24, 0.5, 6, 10), mat(a), { p: [-0.72, 0.05, 0], r: [0, 0, 0.9] })
  add(g, new THREE.CapsuleGeometry(0.24, 0.55, 6, 10), mat(a), { p: [-0.95, 0.6, 0] })
  add(g, new THREE.CapsuleGeometry(0.22, 0.4, 6, 10), mat(a), { p: [0.68, -0.25, 0], r: [0, 0, -0.9] })
  add(g, new THREE.CapsuleGeometry(0.22, 0.45, 6, 10), mat(a), { p: [0.88, 0.25, 0] })
  add(g, new THREE.SphereGeometry(0.18, 8, 8), mat(b), { p: [0, 1.05, 0], s: [1, 0.8, 1] })
  return g
}

/* ── animals ──────────────────────────────────────────────── */

function bigcat([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.45, 1.05, 6, 12), mat(a), { p: [0, 0, 0], r: [0, 0, Math.PI / 2] })
  const head = add(g, new THREE.SphereGeometry(0.42, 12, 10), mat(a), { p: [0.95, 0.42, 0] })
  add(g, new THREE.SphereGeometry(0.16, 8, 8), mat(a), { p: [0.82, 0.82, 0.22] })
  add(g, new THREE.SphereGeometry(0.16, 8, 8), mat(a), { p: [0.82, 0.82, -0.22] })
  add(g, new THREE.SphereGeometry(0.13, 8, 8), mat('#fff'), { p: [1.3, 0.32, 0], s: [1, 0.8, 1.1] })
  eyes(g, 1.22, 0.52, 0, 0.18, 0.9)
  const legGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.75, 8)
  ;[[0.62, 0.28], [0.62, -0.28], [-0.62, 0.28], [-0.62, -0.28]].forEach(([x, z]) =>
    add(g, legGeo, mat(a), { p: [x, -0.7, z] })
  )
  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.05, 0.1, 0),
    new THREE.Vector3(-1.5, 0.45, 0.1),
    new THREE.Vector3(-1.7, 0.9, 0),
  ])
  add(g, new THREE.TubeGeometry(tail, 16, 0.08, 6), mat(a))
  // stripes
  const stripeGeo = new THREE.TorusGeometry(0.47, 0.05, 6, 14, Math.PI)
  for (let i = 0; i < 4; i++)
    add(g, stripeGeo, mat(b), { p: [-0.55 + i * 0.38, 0.05, 0], r: [0, Math.PI / 2, Math.PI] , s: 0.98})
  head.renderOrder = 1
  return g
}

function elephant([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.85, 14, 12), mat(a), { s: [1.35, 1, 1] })
  add(g, new THREE.SphereGeometry(0.52, 12, 10), mat(a), { p: [1.15, 0.5, 0] })
  const earGeo = new THREE.SphereGeometry(0.42, 10, 8)
  add(g, earGeo, mat(b), { p: [1.0, 0.62, 0.5], s: [0.8, 1.1, 0.18], r: [0.25, 0.35, 0] })
  add(g, earGeo, mat(b), { p: [1.0, 0.62, -0.5], s: [0.8, 1.1, 0.18], r: [-0.25, -0.35, 0] })
  const trunk = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.55, 0.45, 0),
    new THREE.Vector3(1.85, 0.05, 0),
    new THREE.Vector3(1.85, -0.45, 0.06),
    new THREE.Vector3(2.0, -0.75, 0),
  ])
  add(g, new THREE.TubeGeometry(trunk, 20, 0.14, 8), mat(a))
  const tuskGeo = new THREE.ConeGeometry(0.06, 0.4, 6)
  add(g, tuskGeo, mat('#fff'), { p: [1.6, 0.1, 0.25], r: [0.3, 0, -2.4] })
  add(g, tuskGeo, mat('#fff'), { p: [1.6, 0.1, -0.25], r: [-0.3, 0, -2.4] })
  eyes(g, 1.42, 0.68, 0, 0.3, 0.9)
  const legGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.8, 8)
  ;[[0.7, 0.4], [0.7, -0.4], [-0.7, 0.4], [-0.7, -0.4]].forEach(([x, z]) =>
    add(g, legGeo, mat(a), { p: [x, -1.05, z] })
  )
  g.scale.setScalar(0.82)
  return g
}

function whale([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.85, 16, 12), mat(a), { s: [1.9, 0.85, 0.9] })
  add(g, new THREE.SphereGeometry(0.8, 14, 10), mat(b), { p: [0.12, -0.2, 0], s: [1.75, 0.72, 0.86] })
  const tail = add(g, new THREE.SphereGeometry(0.4, 10, 8), mat(a), { p: [-1.75, 0.15, 0], s: [0.9, 0.22, 1.6], r: [0, 0, 0.25] })
  tail.rotation.x = 0.15
  const finGeo = new THREE.SphereGeometry(0.3, 8, 8)
  add(g, finGeo, mat(a), { p: [0.45, -0.45, 0.72], s: [1.2, 0.25, 0.6], r: [0.5, -0.4, 0] })
  add(g, finGeo, mat(a), { p: [0.45, -0.45, -0.72], s: [1.2, 0.25, 0.6], r: [-0.5, 0.4, 0] })
  eyes(g, 1.15, 0.05, 0, 0.55, 1)
  // blow spout
  add(g, new THREE.SphereGeometry(0.1, 6, 6), mat('#bae6fd'), { p: [0.55, 0.85, 0] })
  add(g, new THREE.SphereGeometry(0.07, 6, 6), mat('#bae6fd'), { p: [0.45, 1.05, 0.1] })
  add(g, new THREE.SphereGeometry(0.07, 6, 6), mat('#bae6fd'), { p: [0.68, 1.05, -0.08] })
  g.scale.setScalar(0.9)
  return g
}

function shark([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.75, 16, 12), mat(a), { s: [2.1, 0.75, 0.7] })
  add(g, new THREE.SphereGeometry(0.7, 14, 10), mat(b), { p: [0.1, -0.18, 0], s: [1.95, 0.62, 0.66] })
  add(g, new THREE.ConeGeometry(0.42, 0.75, 4), mat(a), { p: [-0.1, 0.72, 0], r: [0, 0, 0.12], s: [1, 1, 0.4] })
  const tailGeo = new THREE.ConeGeometry(0.3, 0.9, 4)
  add(g, tailGeo, mat(a), { p: [-1.7, 0.35, 0], r: [0, 0, -0.6], s: [1, 1, 0.35] })
  add(g, tailGeo, mat(a), { p: [-1.72, -0.25, 0], r: [0, 0, Math.PI + 0.7], s: [0.8, 0.8, 0.35] })
  const finGeo = new THREE.ConeGeometry(0.22, 0.6, 4)
  add(g, finGeo, mat(a), { p: [0.35, -0.4, 0.55], r: [1.9, 0, 0.4], s: [1, 1, 0.4] })
  add(g, finGeo, mat(a), { p: [0.35, -0.4, -0.55], r: [-1.9, 0, 0.4], s: [1, 1, 0.4] })
  eyes(g, 1.25, 0.12, 0, 0.42, 1)
  g.scale.setScalar(0.92)
  return g
}

function butterfly([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.CapsuleGeometry(0.14, 0.85, 6, 10), mat(b))
  add(g, new THREE.SphereGeometry(0.18, 10, 8), mat(b), { p: [0, 0.62, 0] })
  const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4)
  add(g, antGeo, mat(b), { p: [0.1, 0.92, 0.05], r: [0, 0, -0.5] })
  add(g, antGeo, mat(b), { p: [-0.1, 0.92, 0.05], r: [0, 0, 0.5] })
  const wingGeo = new THREE.SphereGeometry(0.5, 10, 8)
  const wing = (sx, top) =>
    add(g, wingGeo, mat(a), {
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
  add(g, new THREE.SphereGeometry(0.62, 14, 12), mat(a), { s: [1.45, 1, 1] })
  const stripeGeo = new THREE.TorusGeometry(0.58, 0.1, 8, 18)
  add(g, stripeGeo, mat(b), { p: [-0.25, 0, 0], r: [0, Math.PI / 2, 0], s: [1, 1, 1] })
  add(g, stripeGeo, mat(b), { p: [0.15, 0, 0], r: [0, Math.PI / 2, 0], s: [0.98, 0.98, 1] })
  add(g, new THREE.SphereGeometry(0.34, 10, 8), mat(b), { p: [0.95, 0.1, 0] })
  add(g, new THREE.ConeGeometry(0.1, 0.35, 6), mat(b), { p: [-1.0, 0, 0], r: [0, 0, Math.PI / 2] })
  eyes(g, 1.18, 0.2, 0, 0.2, 1.1)
  const wingGeo = new THREE.SphereGeometry(0.42, 8, 8)
  const wingMat = mat('#dbeafe', { transparent: true, opacity: 0.7 })
  add(g, wingGeo, wingMat, { p: [0.1, 0.62, 0.35], s: [1.15, 0.12, 0.55], r: [0.35, -0.3, 0] })
  add(g, wingGeo, wingMat, { p: [0.1, 0.62, -0.35], s: [1.15, 0.12, 0.55], r: [-0.35, 0.3, 0] })
  return g
}

function octopus([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.75, 14, 12), mat(a), { p: [0, 0.55, 0], s: [1, 1.15, 1] })
  eyes(g, 0, 0.62, 0.68, 0.3, 1.6)
  const m = mat(a)
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
    add(g, new THREE.SphereGeometry(0.11, 8, 8), mat(b), { p: curve.getPoint(1).toArray() })
  }
  g.scale.setScalar(0.85)
  g.position.y = 0.1
  return g
}

function bird([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.62, 14, 12), mat(a), { s: [1.5, 0.95, 0.85], r: [0, 0, 0.3] })
  add(g, new THREE.SphereGeometry(0.4, 12, 10), mat(b), { p: [0.75, 0.65, 0] })
  add(g, new THREE.ConeGeometry(0.12, 0.4, 6), mat('#f59e0b'), { p: [1.18, 0.6, 0], r: [0, 0, -Math.PI / 2] })
  eyes(g, 0.95, 0.78, 0, 0.24, 1)
  const wingGeo = new THREE.SphereGeometry(0.55, 10, 8)
  add(g, wingGeo, mat(a), { p: [-0.15, 0.35, 0.55], s: [1.5, 0.25, 0.6], r: [0.45, -0.5, -0.35] })
  add(g, wingGeo, mat(a), { p: [-0.15, 0.35, -0.55], s: [1.5, 0.25, 0.6], r: [-0.45, 0.5, -0.35] })
  add(g, new THREE.SphereGeometry(0.35, 8, 8), mat(b), { p: [-1.05, -0.15, 0], s: [1.4, 0.3, 0.7], r: [0, 0, 0.5] })
  return g
}

function penguin([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.75, 14, 12), mat(a), { s: [0.9, 1.35, 0.85] })
  add(g, new THREE.SphereGeometry(0.6, 12, 10), mat('#fff'), { p: [0, -0.12, 0.28], s: [0.75, 1.05, 0.6] })
  add(g, new THREE.SphereGeometry(0.42, 12, 10), mat(a), { p: [0, 1.05, 0] })
  add(g, new THREE.SphereGeometry(0.18, 8, 8), mat(b), { p: [0, 0.82, 0.3], s: [1.2, 0.8, 0.8] })
  add(g, new THREE.ConeGeometry(0.09, 0.3, 6), mat('#f59e0b'), { p: [0, 1.0, 0.48], r: [Math.PI / 2, 0, 0] })
  eyes(g, 0, 1.15, 0.34, 0.17, 1)
  const flipGeo = new THREE.SphereGeometry(0.4, 8, 8)
  add(g, flipGeo, mat(a), { p: [0.72, 0.1, 0], s: [0.25, 1.1, 0.5], r: [0, 0, -0.35] })
  add(g, flipGeo, mat(a), { p: [-0.72, 0.1, 0], s: [0.25, 1.1, 0.5], r: [0, 0, 0.35] })
  const footGeo = new THREE.SphereGeometry(0.2, 8, 6)
  add(g, footGeo, mat('#f59e0b'), { p: [0.26, -1.05, 0.2], s: [0.8, 0.35, 1.4] })
  add(g, footGeo, mat('#f59e0b'), { p: [-0.26, -1.05, 0.2], s: [0.8, 0.35, 1.4] })
  return g
}

function frog([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.75, 14, 12), mat(a), { p: [0, -0.1, 0], s: [1.15, 0.85, 1] })
  const eyeBase = new THREE.SphereGeometry(0.24, 10, 8)
  add(g, eyeBase, mat(a), { p: [0.35, 0.55, 0.32] })
  add(g, eyeBase, mat(a), { p: [0.35, 0.55, -0.32] })
  eyes(g, 0.47, 0.62, 0, 0.36, 1.3)
  const spotGeo = new THREE.SphereGeometry(0.13, 8, 6)
  ;[[-0.3, 0.35, 0.45], [-0.55, 0.1, -0.4], [0.1, 0.42, -0.3], [-0.1, 0.3, 0.55]].forEach((p) =>
    add(g, spotGeo, mat(b), { p, s: [1, 0.4, 1] })
  )
  const legGeo = new THREE.SphereGeometry(0.32, 10, 8)
  add(g, legGeo, mat(b), { p: [-0.55, -0.55, 0.62], s: [1.3, 0.55, 0.7], r: [0, 0.5, 0] })
  add(g, legGeo, mat(b), { p: [-0.55, -0.55, -0.62], s: [1.3, 0.55, 0.7], r: [0, -0.5, 0] })
  const armGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.5, 6)
  add(g, armGeo, mat(a), { p: [0.6, -0.55, 0.35], r: [0, 0, -0.2] })
  add(g, armGeo, mat(a), { p: [0.6, -0.55, -0.35], r: [0, 0, -0.2] })
  g.scale.setScalar(0.95)
  return g
}

function turtle([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.9, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(b), { p: [0, -0.05, 0], s: [1.15, 0.75, 1] })
  add(g, new THREE.CylinderGeometry(1.02, 1.08, 0.16, 16), mat(b), { p: [0, -0.08, 0] })
  const scuteGeo = new THREE.SphereGeometry(0.2, 6, 6)
  ;[[0, 0.55, 0], [0.45, 0.4, 0.3], [-0.45, 0.4, 0.3], [0.45, 0.4, -0.3], [-0.45, 0.4, -0.3]].forEach((p) =>
    add(g, scuteGeo, mat(a), { p, s: [1.2, 0.5, 1.2] })
  )
  add(g, new THREE.SphereGeometry(0.32, 10, 8), mat(a), { p: [1.25, -0.05, 0], s: [1.2, 1, 0.9] })
  eyes(g, 1.42, 0.12, 0, 0.2, 0.9)
  const finGeo = new THREE.SphereGeometry(0.35, 8, 8)
  add(g, finGeo, mat(a), { p: [0.7, -0.25, 0.85], s: [1.3, 0.3, 0.6], r: [0, -0.6, 0] })
  add(g, finGeo, mat(a), { p: [0.7, -0.25, -0.85], s: [1.3, 0.3, 0.6], r: [0, 0.6, 0] })
  add(g, finGeo, mat(a), { p: [-0.75, -0.25, 0.8], s: [1.1, 0.28, 0.55], r: [0, 0.6, 0] })
  add(g, finGeo, mat(a), { p: [-0.75, -0.25, -0.8], s: [1.1, 0.28, 0.55], r: [0, -0.6, 0] })
  g.scale.setScalar(0.85)
  return g
}

function kangaroo([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.72, 14, 12), mat(a), { p: [0, -0.25, 0], s: [0.95, 1.2, 0.85], r: [0, 0, -0.25] })
  add(g, new THREE.SphereGeometry(0.5, 12, 10), mat(b), { p: [0.12, -0.35, 0.2], s: [0.7, 0.95, 0.6], r: [0, 0, -0.2] })
  add(g, new THREE.SphereGeometry(0.34, 12, 10), mat(a), { p: [0.55, 0.95, 0], s: [1.15, 0.95, 0.85] })
  add(g, new THREE.ConeGeometry(0.1, 0.28, 6), mat(b), { p: [0.92, 0.88, 0], r: [0, 0, -Math.PI / 2] })
  const earGeo = new THREE.SphereGeometry(0.16, 8, 8)
  add(g, earGeo, mat(a), { p: [0.42, 1.35, 0.18], s: [0.6, 1.5, 0.4], r: [0.2, 0, -0.15] })
  add(g, earGeo, mat(a), { p: [0.42, 1.35, -0.18], s: [0.6, 1.5, 0.4], r: [-0.2, 0, -0.15] })
  eyes(g, 0.72, 1.05, 0, 0.2, 0.9)
  const thighGeo = new THREE.SphereGeometry(0.42, 10, 8)
  add(g, thighGeo, mat(a), { p: [-0.15, -0.75, 0.5], s: [1.2, 0.9, 0.6] })
  add(g, thighGeo, mat(a), { p: [-0.15, -0.75, -0.5], s: [1.2, 0.9, 0.6] })
  const footGeo = new THREE.SphereGeometry(0.22, 8, 6)
  add(g, footGeo, mat(b), { p: [0.35, -1.15, 0.5], s: [1.9, 0.4, 0.7] })
  add(g, footGeo, mat(b), { p: [0.35, -1.15, -0.5], s: [1.9, 0.4, 0.7] })
  const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 6)
  add(g, armGeo, mat(a), { p: [0.45, 0.25, 0.25], r: [0, 0, 0.6] })
  add(g, armGeo, mat(a), { p: [0.45, 0.25, -0.25], r: [0, 0, 0.6] })
  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, -0.7, 0),
    new THREE.Vector3(-1.15, -1.05, 0),
    new THREE.Vector3(-1.7, -1.1, 0),
  ])
  add(g, new THREE.TubeGeometry(tail, 14, 0.16, 8), mat(a))
  g.position.y = 0.15
  g.scale.setScalar(0.9)
  return g
}

function human([a, b]) {
  const g = new THREE.Group()
  add(g, new THREE.SphereGeometry(0.36, 14, 12), mat(b), { p: [0, 1.05, 0] })
  add(g, new THREE.SphereGeometry(0.38, 12, 10), mat(INK), { p: [0, 1.18, -0.06], s: [1, 0.75, 1] })
  eyes(g, 0, 1.05, 0.32, 0.14, 0.7)
  add(g, new THREE.CapsuleGeometry(0.4, 0.7, 6, 12), mat(a), { p: [0, 0.05, 0] })
  const armGeo = new THREE.CapsuleGeometry(0.11, 0.62, 4, 8)
  add(g, armGeo, mat(a), { p: [0.52, 0.15, 0], r: [0, 0, 0.5] })
  add(g, armGeo, mat(a), { p: [-0.52, 0.15, 0], r: [0, 0, -0.5] })
  add(g, new THREE.SphereGeometry(0.12, 8, 8), mat(b), { p: [0.75, -0.28, 0] })
  add(g, new THREE.SphereGeometry(0.12, 8, 8), mat(b), { p: [-0.75, -0.28, 0] })
  const legGeo = new THREE.CapsuleGeometry(0.13, 0.7, 4, 8)
  add(g, legGeo, mat('#334155'), { p: [0.2, -0.95, 0] })
  add(g, legGeo, mat('#334155'), { p: [-0.2, -0.95, 0] })
  return g
}

const BUILDERS = {
  virus, phage, helixRod, coccus, chain, amoeba, ciliate, euglena, kelp,
  rod: (c) => rod(c),
  rodFlagella: (c) => rod(c, { flagella: 2 }),
  mushroom, budding, moldBrush, stalk, truffle,
  tree, conifer, flower, tulip, flytrap, bamboo, cactus,
  bigcat, elephant, whale, shark, butterfly, bee, octopus, bird, penguin,
  frog, turtle, kangaroo, human,
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
