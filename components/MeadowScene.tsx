type MeadowSceneProps = { night: boolean };

// A fixed seed makes the hand-scattered meadow identical on server and client.
function random(seed: number) {
  // Integer hashing is identical across JS engines; trigonometric pseudo-random
  // functions can differ by tiny amounts and cause SVG hydration warnings.
  let value = seed | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function Cypress({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-5 9 1-159 5 9Z" fill="#162f35" />
      <path d="M0-208C-8-184-8-174-15-160-23-135-18-132-26-109-31-85-24-78-29-56-35-29-24-9-6-8 16-7 30-28 24-56 28-78 19-97 20-113 19-135 10-148 11-167 8-184 4-199 0-208Z" fill="url(#cypress-shadow)" />
      <path d="M0-202C-8-163-1-150-11-123-17-102-7-93-16-65-21-44-13-23-4-14-15-45-4-64-7-84 3-107-4-126 2-145 5-170-1-183 0-202Z" fill="#42635b" opacity=".45" />
      <path d="M1-174-3-128 3-116M-3-139-11-124M0-111-5-72 1-60M-4-86-16-72" fill="none" stroke="#718274" strokeWidth="1" opacity=".25" />
    </g>
  );
}

export default function MeadowScene({ night }: MeadowSceneProps) {
  return (
    <svg
      className={`meadow-illustration ${night ? "meadow-night" : ""}`}
      viewBox="0 0 1600 650"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id="far-hill" x1="800" y1="80" x2="800" y2="400" gradientUnits="userSpaceOnUse">
          <stop stopColor="#63817d" stopOpacity=".12" />
          <stop offset=".65" stopColor="#45696c" stopOpacity=".7" />
          <stop offset="1" stopColor="#32595c" />
        </linearGradient>
        <linearGradient id="mid-hill" x1="900" y1="200" x2="800" y2="530" gradientUnits="userSpaceOnUse">
          <stop stopColor="#53766d" />
          <stop offset=".46" stopColor="#345f59" />
          <stop offset="1" stopColor="#193e40" />
        </linearGradient>
        <linearGradient id="near-hill" x1="700" y1="340" x2="700" y2="650" gradientUnits="userSpaceOnUse">
          <stop stopColor="#496c56" />
          <stop offset=".5" stopColor="#254d40" />
          <stop offset="1" stopColor="#132e30" />
        </linearGradient>
        <linearGradient id="right-hill" x1="1060" y1="300" x2="1410" y2="620" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4b6b55" />
          <stop offset=".46" stopColor="#284f42" />
          <stop offset="1" stopColor="#183b36" />
        </linearGradient>
        <linearGradient id="path-gradient" x1="890" y1="300" x2="780" y2="650" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c7c69b" stopOpacity=".7" />
          <stop offset=".5" stopColor="#adae86" stopOpacity=".62" />
          <stop offset="1" stopColor="#8e9c77" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id="cypress-shadow" x1="-30" y1="-100" x2="25" y2="-100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#193b3e" />
          <stop offset=".5" stopColor="#22463f" />
          <stop offset="1" stopColor="#112f35" />
        </linearGradient>
        <radialGradient id="tree-light">
          <stop stopColor="#f5e8ab" stopOpacity=".5" />
          <stop offset=".35" stopColor="#e8d391" stopOpacity=".12" />
          <stop offset="1" stopColor="#e8d391" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glow-fly">
          <stop stopColor="#fff6c8" />
          <stop offset=".18" stopColor="#ebde9c" stopOpacity=".8" />
          <stop offset=".5" stopColor="#dcda91" stopOpacity=".2" />
          <stop offset="1" stopColor="#d9d999" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tree-crown" x1="935" y1="225" x2="1010" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9baf7e" />
          <stop offset=".45" stopColor="#6f8d65" />
          <stop offset="1" stopColor="#3e6550" />
        </linearGradient>
        <filter id="soft-mist" x="-30%" y="-150%" width="160%" height="400%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="landscape-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="linear" slope=".13" /></feComponentTransfer>
          <feBlend in="SourceGraphic" mode="soft-light" />
        </filter>
      </defs>

      {/* Airy silhouettes and low valley mist give the world its miniature depth. */}
      <g className="distant-landscape">
        <path d="M-40 249C62 228 101 166 196 187S343 259 451 224 584 147 685 183 797 268 924 214 1041 133 1154 165 1352 257 1457 201 1581 165 1640 182V650H-40Z" fill="url(#far-hill)" />
        <path d="M-40 310C88 267 135 286 249 260S401 241 497 267 633 302 750 285 859 241 965 253 1124 295 1235 253 1486 238 1640 276V650H-40Z" fill="#41666a" opacity=".65" />
        <path d="M-40 329C108 290 217 330 364 294 515 257 575 314 728 317 894 320 937 279 1077 299 1256 325 1391 283 1640 319" stroke="#91a49a" strokeWidth="12" opacity=".14" filter="url(#soft-mist)" />
        <path d="M-40 342C137 308 216 319 344 350 481 383 601 344 732 330 854 317 974 346 1061 338 1248 320 1357 310 1640 349V650H-40Z" fill="url(#mid-hill)" />
        <path d="M206 348C340 339 405 362 513 367S681 348 776 339" stroke="#a0b0a0" strokeWidth="3" opacity=".13" />
      </g>

      {/* The winding path quietly draws the eye towards a single luminous tree. */}
      <path d="M-40 405C103 340 236 359 353 401 483 448 630 426 762 378 895 330 997 315 1117 359 1304 427 1451 342 1640 369V650H-40Z" fill="url(#near-hill)" />
      <path d="M1640 348C1457 307 1324 333 1200 349 1105 361 1042 355 989 334 972 354 932 380 867 400 1010 405 1065 446 1091 487 1152 568 1373 568 1640 518Z" fill="url(#right-hill)" />
      <path d="M980 321C949 344 922 352 899 370 867 397 917 412 939 432 972 463 856 474 810 499 738 538 785 580 875 650H687C627 584 650 538 736 498 808 463 911 461 907 434 904 414 849 406 866 379 887 352 951 338 974 320Z" fill="url(#path-gradient)" />
      <path d="M975 325C940 350 912 355 889 376 868 396 923 416 929 433 944 466 820 480 777 507" stroke="#d1cd9b" strokeWidth="1.5" opacity=".28" />
      <path d="M-20 425C112 377 212 392 320 425S483 470 605 443" stroke="#78936a" strokeWidth="2" opacity=".2" />
      <path d="M1060 389C1163 425 1279 379 1420 396S1542 418 1625 406" stroke="#78936a" strokeWidth="2" opacity=".16" />
      <path d="M1045 354C1135 379 1230 350 1337 346" stroke="#b4be8d" strokeWidth="1" opacity=".12" />

      <g className="memory-tree">
        <ellipse cx="978" cy="323" rx="57" ry="8" fill="#1b403b" opacity=".6" />
        <circle cx="976" cy="270" r="100" fill="url(#tree-light)" opacity=".65" />
        <path d="M976 326C977 307 972 288 972 266M975 304 958 283M973 290 990 273" stroke="#a39e71" strokeWidth="5" strokeLinecap="round" />
        <path d="M942 281C919 277 921 255 935 250 927 235 943 218 959 224 970 207 992 215 997 225 1017 221 1026 238 1022 250 1043 262 1032 280 1017 282 1009 298 988 299 978 288 965 297 947 295 942 281Z" fill="url(#tree-crown)" />
        <path d="M936 253C942 239 954 238 965 244 962 230 982 222 993 237 1007 232 1021 248 1011 257 996 252 990 264 977 258 964 266 951 257 936 262Z" fill="#b2bf8c" opacity=".25" />
        {Array.from({ length: 38 }, (_, i) => {
          const x = 937 + random(i + 6) * 80;
          const y = 234 + random(i + 81) * 51;
          return <ellipse key={i} cx={x} cy={y} rx={1.2 + random(i) * 2.1} ry="1" fill={i % 3 ? "#c8d09d" : "#e7deb2"} opacity={.13 + random(i + 4) * .25} transform={`rotate(-25 ${x} ${y})`} />;
        })}
      </g>

      {/* Tall, dark edge trees frame the clearing like the wings of a stage. */}
      <g opacity=".65"><Cypress x={1294} y={369} scale={.42} /><Cypress x={1311} y={370} scale={.33} /><Cypress x={334} y={374} scale={.29} /></g>
      <Cypress x={228} y={456} scale={.92} />
      <Cypress x={176} y={476} scale={.66} />
      <Cypress x={1390} y={461} scale={.78} />
      <Cypress x={1450} y={485} scale={1.13} />
      <Cypress x={1512} y={502} scale={.7} />
      <path d="M-35 438C17 387 66 411 94 440 134 408 175 436 180 474 220 465 236 490 242 516 288 510 340 534 368 565L375 650H-35Z" fill="#173e37" />
      <path d="M1270 650C1304 565 1357 549 1399 563 1433 519 1472 538 1491 547 1518 510 1555 520 1569 535 1609 502 1636 537 1640 546V650Z" fill="#153b35" />

      <g className="meadow-detail">
        {Array.from({ length: 180 }, (_, i) => {
          const x = random(i + 21) * 1600;
          const y = 383 + random(i + 407) * 267;
          const scale = .4 + ((y - 383) / 267) * 1.2;
          if (x > 650 && x < 900 && y > 490) return null;
          const color = ["#527458", "#628363", "#78916a", "#38604b", "#8a9b72"][i % 5];
          return <path key={i} d={`M${x} ${y}q${-7 * scale} ${-10 * scale} ${-5 * scale} ${-19 * scale}m${5 * scale} ${19 * scale}q${4 * scale} ${-16 * scale} ${12 * scale} ${-20 * scale}m${-12 * scale} ${20 * scale}q0 ${-15 * scale} ${2 * scale} ${-28 * scale}`} stroke={color} strokeWidth={.7 + scale * .35} strokeLinecap="round" opacity={.35 + random(i + 89) * .3} />;
        })}
        {Array.from({ length: 103 }, (_, i) => {
          const x = random(i + 777) * 1600;
          const y = 419 + random(i + 1571) * 228;
          const scale = .45 + ((y - 419) / 228) * .95;
          if (x > 660 && x < 880 && y > 490) return null;
          const height = (12 + random(i + 273) * 23) * scale;
          const color = ["#dedbc0", "#b3a7c5", "#bfbbcf", "#e7ddba", "#94adad"][i % 5];
          return (
            <g key={i} className="meadow-flower" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${-random(i + 100) * 9}s`, animationDuration: `${5 + random(i + 34) * 5}s` }} opacity={.5 + random(i + 43) * .45}>
              <path d={`M${x} ${y}q${-5 * scale} ${-height * .5} ${-2 * scale} ${-height}m${2 * scale} ${height * .8}q${-9 * scale} ${-height * .35} ${-9 * scale} ${-height * .5}m${10 * scale} ${height * .32}q${5 * scale} ${-height * .25} ${8 * scale} ${-height * .27}`} stroke="#769372" strokeWidth={.9 * scale} />
              <g transform={`translate(${x - 2 * scale} ${y - height}) scale(${scale})`}>
                <ellipse rx="2.2" ry="4.4" cy="-2.3" fill={color} />
                <ellipse rx="4.4" ry="2.2" cy=".7" fill={color} />
                <ellipse rx="2.2" ry="4.3" cy="-1.2" fill={color} transform="rotate(58)" />
                <circle r="1.1" fill="#d8c487" />
              </g>
            </g>
          );
        })}
      </g>

      <g className="landscape-fireflies">
        {Array.from({ length: 22 }, (_, i) => {
          const x = 155 + random(i + 831) * 1280;
          const y = 300 + random(i + 1283) * 260;
          return <g key={i} className="landscape-firefly" style={{ animationDelay: `${-random(i + 111) * 12}s`, animationDuration: `${7 + random(i + 231) * 8}s` }}><circle cx={x} cy={y} r="10" fill="url(#glow-fly)" opacity=".6" /><circle cx={x} cy={y} r="1.1" fill="#f8edb6" opacity=".8" /></g>;
        })}
      </g>
      <path d="M0 628C235 588 403 639 567 625S850 649 1029 622 1420 592 1600 617V650H0Z" fill="#102e2c" opacity=".55" />
      <g opacity=".3" filter="url(#landscape-grain)"><path d="M0 405Q290 350 520 435T960 380 1600 350V650H0Z" fill="#42614c" opacity=".18" /></g>
    </svg>
  );
}
