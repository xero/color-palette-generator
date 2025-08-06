#!/usr/bin/env node

import {readFile, writeFile} from 'fs/promises';
import {CorePalette, TonalPalette} from '@material/material-color-utilities';
import {converter, clampRgb, formatHex} from 'culori';
import ClosestVector from 'closestvector';

let palette:CorePalette, colornameslist:Record<string, string>;
const
	tones: number[]=[100, 99, 98, 95, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0],
	materialTones=[10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98],
	roles:Record<string, string>={
		a1: 'primary',
		a2: 'secondary',
		a3: 'tertiary',
		n1: 'neutral',
		n2: 'neutralVariant',
	},
	roleTonesLight:Record<string, number>={
		a1: 40,
		a2: 40,
		a3: 40,
		n1: 90,
		n2: 80,
	},
	roleTonesDark:Record<string, number>={
		a1: 80,
		a2: 80,
		a3: 80,
		n1: 20,
		n2: 30,
	},
	paletteRoles=[
		{ key: '', label: 'Primary', class: '' },
		{ key: '-secondary', label: 'Secondary', class: 'secondary' },
		{ key: '-tertiary', label: 'Tertiary', class: 'tertiary' },
		{ key: '-neutral', label: 'Neutral', class: 'neutral' },
		{ key: '-neutralVariant', label: 'Neutral Variant', class: 'neutralVariant' },
	],
	material2tailwind={
		light:{
			"0":   "950",
			"10":  "950",
			"20":  "900",
			"30":  "800",
			"40":  "700",
			"50":  "600",
			"60":  "500",
			"70":  "400",
			"80":  "300",
			"90":  "200",
			"95":  "100",
			"98":  "50",
			"100": "50"
		},
		dark:{
			"100": "950",
			"98":  "950",
			"95":  "900",
			"90":  "800",
			"80":  "700",
			"70":  "600",
			"60":  "500",
			"50":  "400",
			"40":  "300",
			"30":  "200",
			"20":  "100",
			"10":  "50",
			"0":   "50"
		}
	},
	semantic_theme=(theme:'light'|'dark', c:string)=>{
		const matrix=[[[
			// Primary
				[`text-${c}-50`,`bg-${c}-700`],   // light
				[`text-${c}-50`,`bg-${c}-700`]],[ // dark
				[`text-${c}`,`bg-${c}-50`],
				[`text-${c}-400`,`bg-${c}-950`]],[
				[`text-${c}`,`bg-${c}-200`],
				[`text-${c}-950`,`bg-${c}-400`]],[
				[`text-${c}-200`,`bg-${c}-950`],
				[`text-${c}-300`,`bg-${c}-600`]
			]],[[
				[`text-${c}-800`,`bg-${c}-400`],
				[`text-${c}-900`,`bg-${c}-300`]],[
				[`text-${c}-100`,`bg-${c}-900`],
				[`text-${c}-200`,`bg-${c}-700`]],[
				[`text-${c}-100`,`bg-${c}-800`],
				[`text-${c}-300`,`bg-${c}-600`]],[
				[`text-${c}-100`,`bg-${c}-600`],
				[`text-${c}-950`,`bg-${c}-400`]
			]],[[
				[`text-${c}-50`,`bg-${c}-secondary`],
				[`text-${c}-secondary-100`,`bg-${c}-700`]],[
				[`text-${c}-secondary`,`bg-${c}-50`],
				[`text-${c}-secondary-100`,`bg-${c}-secondary-500`]],[
				[`text-${c}-secondary`,`bg-${c}-200`],
				[`text-${c}-secondary-100`,`bg-${c}-secondary-600`]],[
				[`text-${c}-secondary-200`,`bg-${c}-950`],
				[`text-${c}-secondary-100`,`bg-${c}-secondary-700`]
			]],[[
				[`text-${c}-50`,`bg-${c}-tertiary`],
				[`text-${c}-tertiary-100`,`bg-${c}-tertiary-700`]],[
				[`text-${c}-tertiary`,`bg-${c}-50`],
				[`text-${c}-tertiary-100`,`bg-${c}-tertiary-500`]],[
				[`text-${c}-tertiary`,`bg-${c}-tertiary-200`],
				[`text-${c}-tertiary-100`,`bg-${c}-tertiary-600`]],[
				[`text-${c}-tertiary-200`,`bg-${c}-tertiary-950`],
				[`text-${c}-tertiary-100`,`bg-${c}-tertiary-700`]
			]],[[
				[`text-${c}-950`,`bg-${c}-neutral-50`],
				[`text-${c}-neutral`,`bg-${c}-neutral-950`]],[
				[`text-${c}-neutral-50`,`bg-${c}-neutral-950`],
				[`text-${c}-neutral`,`bg-${c}-neutral-700`]],[
				[`text-${c}-neutral-950`,`bg-${c}-neutral-50`],
				[`text-${c}-neutral`,`bg-${c}-neutral-900`]],[
				[`text-${c}-neutral-200`,`bg-${c}-neutral-950`],
				[`text-${c}-neutral`,`bg-${c}-neutral-600`]
			]],[[
				[`text-${c}-neutralVariant-0`,`bg-${c}-neutralVariant-200`],
				[`text-${c}-neutralVariant`,`bg-${c}-neutralVariant-700`]],[
				[`text-${c}-neutralVariant`,`bg-${c}-neutralVariant-800`],
				[`text-${c}-neutralVariant`,`bg-${c}-neutralVariant-800`]],[
				[`text-${c}-neutralVariant`,`bg-${c}-neutralVariant-600`],
				[`text-${c}-neutralVariant`,`bg-${c}-neutralVariant-600`]],[
				[`text-${c}-neutralVariant-100`,`bg-gradient-to-r from-${c} to-${c}-neutralVariant-90`],
				[`text-${c}-neutralVariant`,`bg-gradient-to-r from-${c} to-${c}-neutralVariant-90`]
			]]],
			labels=[
				['Primary','On Primary','Primary Container','On Primary Container'],
				['Invert Primary','Invert On Primary','Invert Primary Container','Invert On Primary Container'],
				['Secondary','On Secondary','Secondary Container','On Secondary Container'],
				['Tertiary','On Tertiary','Tertiary Container','On Tertiary Container'],
				['Background','On Background','Surface','On Surface'],
				['Surface Variant','On Surface Variant','Outline','Gradient']],
			themeIdx=theme==='light'?0:1;
		return matrix.map((block, i)=>({
			a: block.map((cell,j)=>[...cell[themeIdx], labels[i][j]])
		}));
	},
	echo=async(c:number,t:string)=>(
		c?console.error(`error: ${t}`)
		 :console.log(`${t}`),
				await new Promise(r=>setTimeout(r,1))),
	tone2step=(t:number,x=0)=>x?material2tailwind.dark[t]??t:material2tailwind.light[t]??t,
	toneGradient=(c:string,role:string)=>
		materialTones.slice().reverse().map(t=>
			`<button class="tone text-${+t<60?'white':'black'} bg-${c}${role?'-'+role:''}-${tone2step(t)}">${tone2step(t)}</button>`).join('\n'),
	selectRole=(c:string, role:{key:string, label:string, class:string})=>`
		<section>
			<button class="bg-${c}${role.key} text-${c}-100"></button>
			<button class="arrow text-${c}-0">⟶</button>
			${toneGradient(c, role.class)}
		</section>`,
	semanticBlock=(block:{a:string[][]})=>`
		<section>${block.a.map(([txt, bg, lbl])=>
				`<article class="${txt} ${bg}">${lbl}</article>`).join('\n')}
		</section>`,
	buildHTML=(c:string, h:string, invert:(hex:string)=>string)=>
		['light','dark'].map(t=>
			`<main class="${t}">
				<section><h1 class="text-${c}-600">${t==='dark'?'dark ':''}${c} ${t==='dark'?invert(h):h}</h1></section>
				${paletteRoles.map(role=>selectRole(c,role)).join('\n')}
				${semantic_theme(t as 'light'|'dark',c).map(semanticBlock).join('\n')}
			</main>`).join(''),
	colorNames=async ()=>{
		let json:Record<string, string>;
		try {
			json=JSON.parse(await readFile('src/colornames.min.json', 'utf8'));
		} catch {
			await echo(0,'downloading: colornames.min.json from unpkg.com...');
			const res=await fetch('https://unpkg.com/color-name-list/dist/colornames.min.json');
			if(!res.ok) throw new Error('failed fetching color names');
			json=await res.json();
			await writeFile('src/colornames.min.json', JSON.stringify(json));
		}
		colornameslist=json;
	},
	invert=(h:string)=>{
	  const rgb=converter('rgb')(h);
		if(!rgb) throw new Error('invalid color for invert');
		const inverted={
			mode: 'rgb',
			r: 1-rgb.r,
			g: 1-rgb.g,
			b: 1-rgb.b,
			alpha: rgb.alpha??1
		};
		return formatHex(inverted);
	},
	normalize=(n:string,camel=false)=>camel?
    n.replace(/[^a-zA-Z0-9]+/g,' ').replace(/(?:^\w|[A-Z]|\b\w)/g,(w,i)=>i?w.toUpperCase():w.toLowerCase()).replace(/\s+/g,''):
    n.replace(/[^a-zA-Z0-9]/g,'-').toLowerCase(),
	argb2rgb=(argb:number):[number, number, number]=>[(argb >> 16) & 0xff, (argb >> 8) & 0xff, argb & 0xff],
	rgb2argb=({ r, g, b, alpha }:{r:number,g:number, b:number, alpha?:number })=>{
		// clamp to [0, 1]
		const R=Math.round(Math.max(0, Math.min(1,r)) * 255);
		const G=Math.round(Math.max(0, Math.min(1,g)) * 255);
		const B=Math.round(Math.max(0, Math.min(1,b)) * 255);
		const A=alpha===undefined? 255: Math.round(Math.max(0, Math.min(1,alpha)) * 255);
		return (A<<24) | (R<<16) | (G<<8) | B;
	},
	argb2hex=(argb:number):string=>`#${(argb & 0xffffff).toString(16).padStart(6, '0')}`,
	hex2rgb=(color:string):[number, number, number]=>{
		const rgb=converter('rgb')(color);
		if(!rgb) throw new Error('invalid color');
		return [
			Math.round(rgb.r * 255),
			Math.round(rgb.g * 255),
			Math.round(rgb.b * 255)
		];
	},
	palette2css=(role:string, palette:TonalPalette, prefix:string, mainTone:number, tonesMap:number[]=tones, mode:number=0):string=>{
		const shortName=(role === 'primary' || roles[role]==='primary') ? prefix : prefix + '-' + (roles[role] || role);
		const lines: string[]=[`	--color-${shortName}:${argb2hex(palette.tone(mainTone))};`];
		for(const t of tonesMap){
			lines.push(`	--color-${shortName}-${tone2step(t,mode)}:${argb2hex(palette.tone(t))};`);
		}
		return lines.join('\n');
	},
	parse=(color:string)=>{
		const
			rgbConv=converter('rgb'),
			parsed=rgbConv(color);
		if(!parsed) throw new Error('failed parsing color');
		palette=CorePalette.of(rgb2argb(clampRgb(parsed)));
	},
	task=async (f:Function, t:string, ...args:any[])=>{
		try { await f(...args); } catch (e){ await echo(1, t); process.exit(1) }
	},
	save=async (css:string, html:string)=>{
		await writeFile('src/index.html', html);
		await echo(0,'test file written to `src/index.html`');
		await writeFile('src/palette.css', css);
		await echo(0,'Wrote CSS palette to `src/palette.css`');
	},
	main=async()=>{
		const [,,...colorArgs]=Bun.argv;
		if(colorArgs.length===0){
			await echo(1,'usage: bun palette.ts <color> [<color> ...]');
			process.exit(1);
		}
		const palettes:{
			cssVars:string;
			cssVarsDark:string;
			prefix:string;
			colorName:string;
			colorHex:string;
		}[]=[];
		await task(colorNames, "failed downloading color names list");
		const name2hex:Record<string,string>={};
		for(const [hex,name] of Object.entries(colornameslist)){
			name2hex[normalize(name)]=`#${hex}`;
		}
		const
			colornames=Object.entries(colornameslist).map(([hex, name])=>({hex:`#${hex}`, name})),
			nameList=colornames.map((c:{hex:string})=>hex2rgb(c.hex)),
			closest=new ClosestVector(nameList,false);
		for(const colorArg of colorArgs){
			await task(parse, "Failed to parse color", colorArg);
			const
				rev=materialTones.reverse(),
				{index:primaryIndex}=closest.get(argb2rgb(palette.a1.tone(roleTonesLight.a1))),
				colorName=colornames[primaryIndex]?.name || 'custom',
				prefix=normalize(colorName), //prefix=camelize(colorName),
				colorHex=name2hex[prefix],
				cssVars=[
					palette2css('a1', palette.a1, prefix, roleTonesLight.a1, materialTones),
					palette2css('a2', palette.a2, prefix, roleTonesLight.a2, materialTones),
					palette2css('a3', palette.a3, prefix, roleTonesLight.a3, materialTones),
					palette2css('n1', palette.n1, prefix, roleTonesLight.n1, materialTones),
					palette2css('n2', palette.n2, prefix, roleTonesLight.n2, materialTones),
				].join('\n'),
				cssVarsDark=[
					palette2css('a1', palette.a1, prefix, roleTonesDark.a1, rev, 1).replace(/#[0-9a-fA-F]{6}/g,m=>invert(m)),
					palette2css('a2', palette.a2, prefix, roleTonesDark.a2, rev, 1).replace(/#[0-9a-fA-F]{6}/g,m=>invert(m)),
					palette2css('a3', palette.a3, prefix, roleTonesDark.a3, rev, 1).replace(/#[0-9a-fA-F]{6}/g,m=>invert(m)),
					palette2css('n1', palette.n1, prefix, roleTonesDark.n1, rev, 1).replace(/#[0-9a-fA-F]{6}/g,m=>invert(m)),
					palette2css('n2', palette.n2, prefix, roleTonesDark.n2, rev, 1).replace(/#[0-9a-fA-F]{6}/g,m=>invert(m)),
				].join('\n');
			palettes.push({cssVars, cssVarsDark, prefix, colorName, colorHex});
		}
		const
			css=`@theme {\n${palettes.map(p=>p.cssVars).join('\n')}\n}\n.dark {\n${palettes.map(p=>p.cssVarsDark).join('\n')}\n}\n`,
			maxHex=Math.max(...palettes.map(p=>p.colorHex.length)),
			maxName=Math.max(...palettes.map(p=>p.colorName.length)),
			maxColor=Math.max(...palettes.map(p=>p.prefix.length));
		let test=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" type="text/css" href="site.min.css"></head><body>`;
		for(const p of palettes){
			await echo(0,`#${p.colorHex.replace('#','').padEnd(maxHex, ' ')} → ${p.colorName.padEnd(maxName, ' ')} → --color-${p.prefix.padEnd(maxColor, ' ')}`);
			test+=buildHTML(p.prefix,p.colorHex,invert);
		}
		test+=`<br></body></html>`;
		await task(save, "Failed to write files", css, test);
	};
main();
