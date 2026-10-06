/** Local, integer-pixel volcanic scenery. No external assets or random frame noise. */
export function drawArenaScene(ctx: CanvasRenderingContext2D, seconds: number, width = 480): void {
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
  }
  const poly = (points: number[][], color: string) => {
    ctx.fillStyle = color
    for (let y = Math.floor(Math.min(...points.map(p => p[1]))); y <= Math.ceil(Math.max(...points.map(p => p[1]))); y++) {
      const edges: number[] = []
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[j], b = points[i]
        if ((a[1] > y + .5) !== (b[1] > y + .5)) edges.push(a[0] + (y + .5 - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
      }
      edges.sort((a, b) => a - b)
      for (let i = 0; i + 1 < edges.length; i += 2) ctx.fillRect(Math.ceil(edges[i]), y, Math.floor(edges[i + 1]) - Math.ceil(edges[i]) + 1, 1)
    }
  }
  const line = (points: number[][], size: number, color: string) => {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))
      for (let n = 0; n <= steps; n++) { const f = steps ? n / steps : 0; rect(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, size, size, color) }
    }
  }
  const coast = width * 208 / 480
  rect(0, 0, width, 224, '#000000')
  // Sparse stars with slow brightness changes and occasional four-point glints.
  for (let i = 0; i < Math.ceil(58 * width / 480); i++) {
    const x = 9 + i * 73 % (width - 15), y = 5 + i * 47 % 139
    const bright = Math.sin(seconds * .7 + i * 2.1) > .45
    rect(x, y, 1, 1, bright ? '#abbfd3' : '#344354')
    if (i % 13 === 0 && bright) { rect(x - 1, y, 3, 1, '#738caa'); rect(x, y - 1, 1, 3, '#738caa'); rect(x, y, 1, 1, '#e5edff') }
  }
  ctx.save(); ctx.scale(width / 480, 1)
  // Low distant ridges remain darker than the foreground and the pet silhouettes.
  poly([[0,189],[0,174],[27,154],[48,163],[72,148],[105,170],[136,157],[170,174],[210,154],[246,174],[289,149],[321,163],[348,147],[391,161],[442,150],[480,168],[480,189]], '#0e0e13')
  poly([[20,189],[70,163],[90,171],[129,184],[174,173],[203,183],[242,159],[263,171],[296,185],[325,170],[361,187],[419,164],[480,181],[480,195]], '#18151a')
  ctx.restore()
  ctx.save(); ctx.translate(width - 480, 0)
  // Smoke travels upwards from the crater; stepped silhouettes avoid vector blur.
  for (let i = 7; i >= 0; i--) {
    const age = (seconds * .18 + i / 8) % 1, x = 412 + age * 10 + Math.sin(age * 7 + i) * 3, y = 88 - age * 77
    const r = 4 + age * 10
    poly([[x-r,y-r/2],[x-r+3,y-r],[x+r-3,y-r],[x+r,y-r/2],[x+r+2,y+3],[x+r-2,y+r/2],[x-r,y+r/2]], age > .65 ? '#101014' : age > .3 ? '#201b21' : '#3b2425')
  }
  // Main volcano: asymmetric slopes, crater rim, sharply faceted basalt.
  poly([[320,189],[347,158],[365,130],[385,105],[394,84],[406,80],[419,82],[427,99],[445,126],[457,153],[480,179],[480,190]], '#33252b')
  poly([[320,189],[361,163],[384,124],[397,92],[408,86],[396,138],[374,171],[369,189]], '#241e25')
  poly([[418,87],[433,118],[456,151],[480,181],[480,190],[443,178],[428,143],[413,110]], '#472d2f')
  poly([[347,173],[366,142],[387,115],[371,152],[366,170],[385,162],[374,187]], '#49353a')
  poly([[437,127],[452,158],[447,178],[430,148],[422,118]], '#624039')
  line([[353,163],[375,136],[387,109]], 1, '#71504b')
  line([[429,106],[442,134],[459,165]], 1, '#956049')
  // Lava rivers flow over the slopes, with darker banks and moving hot cores.
  const rivers = [[[405,88],[400,108],[407,127],[398,143],[403,157],[390,178],[392,190]], [[416,87],[424,108],[421,125],[435,147],[442,167],[462,190]]]
  for (const river of rivers) { line(river, 6, '#652a21'); line(river, 3, '#e54c23'); line(river, 1, '#ffc567') }
  for (let i = 0; i < 14; i++) { const f = (seconds * .23 + i * .071) % 1; rect(400 + Math.sin(f * 10) * 5, 96 + f * 85, 2, 3, '#ffdf83') }
  poly([[393,84],[400,79],[416,80],[425,86],[418,91],[399,90]], '#812e24')
  rect(399,83,19,4,'#fa752e'); rect(404,83,11,2,'#ffe2a0')
  // Persistent small eruption: each cinder has its own ballistic arc and trail.
  for (let i = 0; i < 14; i++) {
    const f = (seconds * (.3 + i % 3 * .025) + i / 14) % 1, direction = i % 2 ? 1 : -1
    const x = 410 + direction * f * (18 + i * 2), y = 84 - Math.sin(f * Math.PI) * (22 + i % 5 * 8) + f * 8
    rect(x - direction * 2,y - 3,1,4,'#ad3a23'); rect(x,y,2,3,'#ff9c3b'); rect(x,y,1,1,'#ffe5a4')
  }
  ctx.restore()
  // Ocean occupies the left coast; waves translate along straight pixel bands.
  rect(0,166,coast,58,'#06131f')
  rect(0,166,coast,1,'#29485c')
  rect(0,178,coast,12,'#081d2d'); rect(0,190,coast,17,'#0b2638'); rect(0,207,coast,17,'#102f41')
  for (let row = 0; row < 6; row++) for (let i = 0; i < Math.ceil(coast / 37); i++) {
    const x = ((i * 37 + seconds * (row % 2 ? 3 : -4) + row * 17) % (coast + 22) + coast + 22) % (coast + 22) - 15
    const y = 174 + row * 8
    if (x < coast - 8) { rect(x,y,Math.min(12 + i % 3 * 3,coast-8-x),1,row % 2 ? '#326078' : '#204454'); rect(x+3,y+1,5,1,'#183c50') }
  }
  // A quiet star reflection ripples over the water.
  for (let i = 0; i < 8; i++) rect(66 + Math.sin(seconds * .6 + i) * 4 - i, 171 + i * 5, 2 + i * 2, 1, i % 2 ? '#426071' : '#203c4c')
  // Flat basalt shelf with angular fissures, rather than rows of rounded tiles.
  rect(coast,189,width-coast,35,'#242127')
  rect(coast,189,width-coast,2,'#65504a'); rect(coast,191,width-coast,2,'#373036')
  rect(coast,219,width-coast,5,'#19191f')
  for (let i = 0; i < Math.ceil((width - coast) / 23); i++) {
    const x = coast + 9 + i * 23, shift = i % 3 * 2
    const crack = [[x,190],[x+shift,199],[x-5,204],[x+5,210],[x+2,224]]
    const hot = Math.sin(seconds * 1.2 + i) > .25
    line(crack,3,'#4e231f'); line(crack,1,hot ? '#f38536' : '#ad4126')
    line([[x-5,204],[x-13,207],[x-19,205]],1,'#b9562c')
    if (hot) rect(x+shift,198,1,3,'#ffca6f')
  }
  for (let i = 0; i < Math.ceil((width - coast) / 7); i++) { const x = coast + 2 + i * 37 % (width - coast - 3), y = 195 + i * 13 % 25; rect(x,y,2+i%4,1,i%3 ? '#342d34' : '#56403c') }
  ctx.save(); ctx.translate(coast - 208, 0)
  // Straight rock edge at the water, with short foam strokes and rising steam.
  poly([[201,190],[208,187],[214,189],[214,224],[202,224],[204,215],[199,209],[203,203]],'#393137')
  line([[201,190],[208,187],[214,189]],1,'#86706a')
  for (let i = 0; i < 4; i++) {
    const y = 192+i*8, wave = Math.round(Math.sin(seconds*1.1+i)*2)
    rect(194+wave,y,6,1,'#7fabb7'); rect(191+wave,y+1,3,1,'#3e7288')
    const f = (seconds*.15+i*.25)%1; rect(200+Math.sin(f*5)*2,190-f*17,1,3,f < .5 ? '#666168' : '#25232a')
  }
  ctx.restore()
  ctx.save(); ctx.translate(width - 480, 0)
  // Raised foreground rocks and rising embers anchor Groudon's lava territory.
  for (const [x,y,r] of [[275,194,9],[312,209,8],[466,195,11],[240,219,5],[226,214,4]]) {
    poly([[x-r,y],[x-r+3,y-r/2],[x+2,y-r],[x+r,y-3],[x+r-2,y+2]], '#3b3034')
    line([[x-r+3,y-r/2],[x+2,y-r],[x+r,y-3]],1,'#785044')
  }
  for (let i = 0; i < 16; i++) {
    const f = (seconds * .12 + i / 16) % 1
    rect(290 + i * 11 + Math.sin(seconds + i) * 2, 187 - f * 72, 1, 2, f < .4 ? '#e57a36' : '#6b3427')
  }
  ctx.restore()
}
