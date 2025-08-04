#!/usr/bin/env node

import {writeFile} from 'fs/promises';
import {CorePalette, TonalPalette} from '@material/material-color-utilities';
import ClosestVector from 'closestvector';

const
	tones:number[]=[100, 99, 98, 95, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0],
	steps:number[]=[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
	roleTonesLight: Record<string, number>={
		a1: 40, // primary
		a2: 40, // secondary
		a3: 40, // tertiary
		n1: 90, // neutral
		n2: 80, // neutralVariant
	},
	roleTonesDark: Record<string, number>={
		a1: 80, // primary
		a2: 80, // secondary
		a3: 80, // tertiary
		n1: 20, // neutral
		n2: 30, // neutralVariant
	},
	roles: Record<string, string>={
		a1: 'primary',
		a2: 'secondary',
		a3: 'tertiary',
		n1: 'neutral',
		n2: 'neutralVariant',
	},
	fetchColorNames=async ():Promise<Record<string, string>>=>{
		console.log('Downloading: colornames.min.json from unpkg.com...');
		const res=await fetch('https://unpkg.com/color-name-list/dist/colornames.min.json');
		if(!res.ok) throw new Error('Failed to fetch color names');
		return await res.json();
	},
	invert=(h:string)=>{
		h=h.replace(/^#/, '');
		if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
		if(h.length!==6) throw new Error('Error: Invalid hex color for invert');
		return ('#'+[0,2,4].map(i=>(255-parseInt(h.slice(i,i+2),16)).toString(16).padStart(2, '0')).join(''));
	},
	normalize=(name:string):string=>name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
	argb2rgb=(argb:number):[number, number, number]=>[(argb >> 16) & 0xff, (argb >> 8) & 0xff, argb & 0xff],
	argb2hex=(argb:number):string=>`#${(argb & 0xffffff).toString(16).padStart(6, '0')}`,
	hex2rgb=(hex:string):[number, number, number]=>{
		let h=hex.replace(/^#/, '');
		if(h.length===3) h=h.split('').map(x=>x+x).join('');
		const num=parseInt(h, 16);
		return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
	},
	palette2tailwind=(role:string, prefix:string, s:number[]=steps)=>{
		const result: Record<string, string> = {};
		const key = role === 'primary' ? prefix : `${prefix}-${role}`;
		result["DEFAULT"] = `var(--color-${key})`;
		for (let i = 0; i < s.length; i++) {
			result[s[i]] = `var(--color-${key}-${s[i]})`;
		}
		return result;
	},
	palette2css=(role:string, palette:TonalPalette, prefix:string, mainTone:number, tonesMap:number[]=tones, mode:number=0):string=>{
		const shortName = (role === 'primary' || roles[role]==='primary') ? prefix : prefix + '-' + (roles[role] || role);
		const lines: string[] = [`	--color-${shortName}:${argb2hex(palette.tone(mainTone))};`];
		for (const t of tonesMap) {
			lines.push(`	--color-${shortName}-${t}:${argb2hex(palette.tone(t))};`);
		}
		return mode===0 ? lines.join('\n') : lines.reverse().join('\n');
	},
	parse=(color:string):number=>{
		let hex=color.trim().replace(/^#/, '');
		if(hex.length===3) hex=hex.split('').map(x=>x+x).join('');
		if(hex.length===6) hex='ff' + hex;
		if(hex.length!==8) throw new Error(`Error: Invalid color input:'${color}' \nAccepted formats: #RRGGBB RRGGBB #RGB RGB`);
		return parseInt(hex, 16);
	},
	main=async()=>{
		const [,,...colorArgs]=Bun.argv;
		if(colorArgs.length===0) {
			console.error('Usage: bun palette.ts <hexcolor> [<hexcolor> ...]');
			process.exit(1);
		}
		const palettes:{
			cssVars:string;
			cssVarsDark:string;
			twColors:Record<string, any>;
			colorNameNorm:string;
			colorName:string;
			colorArg:string;
		}[]=[];

		const colornamesObj=await fetchColorNames();
		const nameToHex:Record<string,string>={};
		for (const [hex,name] of Object.entries(colornamesObj)) {
				nameToHex[normalize(name)]=`#${hex}`;
		}
		for (const colorArg of colorArgs) {
			let seedColor:number;
			try {
				seedColor=parse(colorArg);
			} catch (e) {
				console.error(e instanceof Error ? e.message :e);
				process.exit(1);
			}
			const
				colornames=Object.entries(colornamesObj).map(([hex, name])=>({hex:`#${hex}`, name})),
				nameList=colornames.map((c:{hex:string})=>hex2rgb(c.hex)),
				closest=new ClosestVector(nameList),
				palette=CorePalette.of(seedColor),
				primaryTone=roleTonesLight.a1,
				primaryArgb=palette.a1.tone(primaryTone),
				primaryRgb=argb2rgb(primaryArgb),
				{index:primaryIndex}=closest.get(primaryRgb),
				colorName=colornames[primaryIndex]?.name || 'custom',
				colorNameNorm=normalize(colorName),
				prefix=colorNameNorm,
				cssVars=[
					palette2css('a1', palette.a1, prefix, roleTonesLight.a1, tones),
					palette2css('a2', palette.a2, prefix, roleTonesLight.a2, tones),
					palette2css('a3', palette.a3, prefix, roleTonesLight.a3, tones),
					palette2css('n1', palette.n1, prefix, roleTonesLight.n1, tones),
					palette2css('n2', palette.n2, prefix, roleTonesLight.n2, tones),
				].join('\n'),
				cssVarsDark=[
					palette2css('a1', palette.a1, prefix, roleTonesDark.a1, tones.reverse()).replace(/#[0-9a-fA-F]{6}/g,x=>invert(x)),
					palette2css('a2', palette.a2, prefix, roleTonesDark.a2, tones.reverse()).replace(/#[0-9a-fA-F]{6}/g,x=>invert(x)),
					palette2css('a3', palette.a3, prefix, roleTonesDark.a3, tones.reverse()).replace(/#[0-9a-fA-F]{6}/g,x=>invert(x)),
					palette2css('n1', palette.n1, prefix, roleTonesDark.n1, tones.reverse()).replace(/#[0-9a-fA-F]{6}/g,x=>invert(x)),
					palette2css('n2', palette.n2, prefix, roleTonesDark.n2, tones.reverse()).replace(/#[0-9a-fA-F]{6}/g,x=>invert(x)),
				].join('\n'),
				twColors:Record<string, any>={
					[`${prefix}`]: palette2tailwind(roles.a1, prefix, steps),
					[`${prefix}-secondary`]: palette2tailwind(roles.a2, prefix, steps),
					[`${prefix}-tertiary`]: palette2tailwind(roles.a3, prefix, steps),
					[`${prefix}-neutral`]: palette2tailwind(roles.n1, prefix, steps),
					[`${prefix}-neutral-variant`]: palette2tailwind(roles.n2, prefix, steps),
				};
			palettes.push({cssVars, cssVarsDark, twColors, colorNameNorm, colorName, colorArg});
		}
		const
			allCssVars=palettes.map(p=>p.cssVars).join('\n'),
			allCssVarsDark=palettes.map(p=>p.cssVarsDark).join('\n'),
			css=`@theme {\n${allCssVars}\n}\n.dark {\n${allCssVarsDark}\n}\n`,
			allTwColors=Object.assign({}, ...palettes.map(p=>p.twColors)),
			config=`module.exports={
	darkMode:'class',
	content:[
		'./src/index.html',
		'./src/palette.css',
	],
	theme:{
		extend:{
			colors:${JSON.stringify(allTwColors, null, '\t').replace(/\n/g, '\n\t\t\t')}
		}
	}
}`;
		try {
			const
			maxName=Math.max(...palettes.map(p=>p.colorName.length)),
			maxColor=Math.max(...palettes.map(p=>p.colorNameNorm.length));
			let test=`<!DOCTYPE html><html lang="en"><head><title>color template</title><meta charset="UTF-8"><meta name="author" content="xero (https://x-e.ro)"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" type="text/css" href="template.min.css?buildtime"></head><body>`;
			for (const p of palettes) {
				console.log(`#${p.colorArg.replace('#','').padEnd(6, ' ')} → ${p.colorName.padEnd(maxName, ' ')} → --color-${p.colorNameNorm.padEnd(maxColor, ' ')}`);
				let c=p.colorNameNorm, h=nameToHex[c];
				test+=`
<main class="light">
	<section><h1 class="text-${c}-50">${c} ${h}</h1></section>
	<section>
		<button class="bg-${c} text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-100">100</button>
	</section>
	<section>
		<button class="bg-${c}-secondary text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-100">100</button>
	</section>
	<section>
		<button class="bg-${c}-tertiary text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-100">100</button>
	</section>
	<section>
		<button class="bg-${c}-neutral text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-100">100</button>
	</section>
	<section>
		<button class="bg-${c}-neutralVariant text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-100">100</button>
	</section>
	<section class="col-4">
		<article class="text-${c}-100 bg-${c}-40">Primary</article>
		<article class="text-${c} bg-${c}-100">On Primary</article>
		<article class="text-${c} bg-${c}-90">Primary Container</article>
		<article class="text-${c}-90 bg-${c}-10">On Primary Container</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-30 bg-${c}-70">Invert Primary</article>
		<article class="text-${c}-90 bg-${c}-20">Invert On Primary</article>
		<article class="text-${c}-90 bg-${c}-30">Invert Primary Container</article>
		<article class="text-${c}-90 bg-${c}-50">Invert On Primary Container</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-secondary-100 bg-${c}-secondary-40">Secondary</article>
		<article class="text-${c}-secondary bg-${c}-secondary-100">On Secondary</article>
		<article class="text-${c}-secondary bg-${c}-secondary-90">Secondary Container</article>
		<article class="text-${c}-secondary-90 bg-${c}-secondary-10">On Secondary Container</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-tertiary-100 bg-${c}-tertiary-40">Tertiary</article>
		<article class="text-${c}-tertiary bg-${c}-tertiary-100">On Tertiary</article>
		<article class="text-${c}-tertiary bg-${c}-tertiary-90">Tertiary Container</article>
		<article class="text-${c}-tertiary-90 bg-${c}-tertiary-10">On Tertiary Container</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-neutral-0 bg-${c}-neutral-99">Background</article>
		<article class="text-${c}-neutral bg-${c}-neutral-10">On Background</article>
		<article class="text-${c}-neutral-0 bg-${c}-neutral-99">Surface</article>
		<article class="text-${c}-neutral-90 bg-${c}-neutral-10">On Surface</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-neutralVariant-0 bg-${c}-neutralVariant-90">Surface Variant</article>
		<article class="text-${c}-neutralVariant bg-${c}-neutralVariant-30">On Surface Variant</article>
		<article class="text-${c}-neutralVariant bg-${c}-neutralVariant-50">Outline</article>
		<article class="text-${c}-neutralVariant-100 bg-gradient-to-r from-${c} to-${c}-neutralVariant-90;">Gradient</article>
	</section>
</main>

<main class="dark">
	<section><h1 class="text-${c}-50">dark ${c} ${invert(h)}</h1></section>
	<section>
		<button class="bg-${c} text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-100">100</button>
	</section>
	<section>
		<button class="bg-${c}-secondary text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-secondary-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-secondary-100">100</button>
	</section>
	<section>
		<button class="bg-${c}-tertiary text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-tertiary-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-tertiary-100">100</button>
	</section>
	<section>
		<button class="bg-${c}-neutral text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-neutral-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-neutral-100">100</button>
	</section>
	<section>
		<button class="bg-${c}-neutralVariant text-${c}-100"></button>
		<button class="arrow text-${c}-0">⟶</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-0">0</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-10">10</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-20">20</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-30">30</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-40">40</button>
		<button class="tone text-${c}-100 bg-${c}-neutralVariant-50">50</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-60">60</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-70">70</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-80">80</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-90">90</button>
		<button class="tone text-${c}-0 bg-${c}-neutralVariant-100">100</button>
	</section>
	<section class="col-4">
		<article class="text-${c}-0 bg-${c}-80">Primary</article>
		<article class="text-${c}-30 bg-${c}-100">On Primary</article>
		<article class="text-${c}-0 bg-${c}-50">Primary Container</article>
		<article class="text-${c}-20 bg-${c}-80">On Primary Container</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-70 bg-${c}-30">Invert Primary</article>
		<article class="text-${c}-10 bg-${c}-80">Invert On Primary</article>
		<article class="text-${c}-10 bg-${c}-70">Invert Primary Container</article>
		<article class="text-${c}-10 bg-${c}-50">Invert On Primary Container</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-secondary-0 bg-${c}-secondary-80">Secondary</article>
		<article class="text-${c}-secondary-30 bg-${c}-secondary-100">On Secondary</article>
		<article class="text-${c}-secondary bg-${c}-secondary-30">Secondary Container</article>
		<article class="text-${c}-secondary-10 bg-${c}-secondary-90">On Secondary Container</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-tertiary-0 bg-${c}-tertiary-80">Tertiary</article>
		<article class="text-${c}-tertiary-30 bg-${c}-tertiary-100">On Tertiary</article>
		<article class="text-${c}-tertiary bg-${c}-tertiary-30">Tertiary Container</article>
		<article class="text-${c}-tertiary-10 bg-${c}-tertiary-90">On Tertiary Container</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-neutral-0 bg-${c}-neutral-99">Background</article>
		<article class="text-${c}-neutral bg-${c}-neutral-80">On Background</article>
		<article class="text-${c}-neutral bg-${c}-neutral-99">Surface</article>
		<article class="text-${c}-neutral-10 bg-${c}-neutral-80">On Surface</article>
	</section>
	<section class="col-4">
		<article class="text-${c}-neutralVariant-0 bg-${c}-neutralVariant-90">Surface Variant</article>
		<article class="text-${c}-neutralVariant bg-${c}-neutralVariant-70">On Surface Variant</article>
		<article class="text-${c}-neutralVariant bg-${c}-neutralVariant-50">Outline</article>
		<article class="text-${c}-neutralVariant-0 bg-gradient-to-r from-${c} to-${c}-neutralVariant-90;">Gradient</article>
	</section>
</main>`;
			}
			test+=`</body></html>`;
			await writeFile('src/index.html', test);
			console.log('test file written to `src/palette.html`');
			await writeFile('src/palette.css', css);
			console.log('Wrote CSS palette to `src/palette.css`');
			await writeFile('tailwind.config.js', config);
			console.log('Wrote Tailwind config to `tailwind.config.js`');
		} catch {
			console.error('Error: Failed writing files');
			process.exit(1);
		}
	};
main();
