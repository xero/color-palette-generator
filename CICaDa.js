import {$} from "bun";
import {argv} from "process";
import {readFile,writeFile} from "fs/promises";

const
	C=console.log,
	E=console.error,
	echo=async (m,t)=>{
		switch(m) {
			case 0:
				C(`               |     task: ${t.padEnd(9)}   Complete!      |`);
			break;
			case 1:
				E(`               *     task: ${t.padEnd(9)}   FAILED!        *`);
				echo(2);
			break;
			case 2:
				C(`               |______________________________________|`);
			break;
			case 3:
				E(`               *     commit your changes first!       *`);
			break;
			default:
				C(`  ......._                                                  _.......
.'        "-.._                                        _..-"        \`.
 ".      .' \` .\`'-~-._                          _.-~-"\`. ' \`.   '  ."
  ".  .         \` .   "-.      _)_.._(_      .-"   . '         .. ."
    ". ...     .. .\`.    \`.   (_)    (_)   .'    .'. ..     ...  ;vnm
      '_   '\` ..      \`.   \\\. | '____' | ./   .'      .. '\`   _.'imp!
        "-.. '  \`   ..      \\\\'-~.__.~-'//      ..   '  \` ..-"
            "\`..          .' . '      ' . \`.          ..'"
           .'"   " .  . '    \`. '.--.' .'    \` .  . "   "\`.
           "            .'   '\\\ \\\    / /\`   \`.            "
            \`... .. .  '    ' (,-\`  '-,) \`    \`  . .. ...'
                     \`.  . "  (--------)  " .  .'
                       "      (--------)      "
                ____________  \`--------'  ____________
               |               \`.____.'               |
               |  CICaDa CI/CD  \`.__.'  Build System  |
               |                                      |`);
			break;
		}
	},
	clean=async _=>{
		await $`rm -rf ./dist`;
		await $`mkdir -p ./dist`;
	},
	style=async _=>{
		await $`postcss -o ./dist/template.min.css ./src/template.css`;
		let css=await readFile("./dist/template.min.css", "utf8");
		if (!css || css.trim().length===0) {
			throw new Error("PostCSS failed");
		}
		css=css.replace("tailwindcss v4.1.11 | MIT License | https://tailwindcss.com",`\n┳━┓┏┓┓┳━┓┳━┓┳━━┓ ┳  ┳ ┳┳━┓┳━┓┳━┓o┓━┓┏━┓┏┓┓\n┃━┫┃┃┃┃ ┃┃┳┛┣━ ┃┃┃  ┃━┫┃━┫┃┳┛┃┳┛┃┗━┓┃ ┃┃┃┃\n┇ ┗┛┗┛┗━┛┛┗━┻━┛┗┻┛  ┇ ┗┛ ┗┛┗━┛┗━┇━━┛┛━┛┛┗┛\n`);
		await writeFile("./dist/template.min.css", css);
		await uncache();
	},
	uncache=async _=>{
		await $`cp ./src/index.html ./dist/index.html`;
		let indexHtml=await readFile("./dist/index.html", "utf8");
		indexHtml=indexHtml.replace(/buildtime/g, `${Math.floor(Date.now() / 1000)}`);
		await writeFile("./dist/index.html", indexHtml);
	},
	task=async (f,t)=>{
		try {
			await f();
			await echo(0,t);
		} catch (e) {
			await echo(1,t);
			throw e;
		}
	},
	build=async _=>{
		await task(clean, "clean");
		await task(style, "style");
	},
	main=async _=>{
		await echo();
		const args=argv.slice(2);
		try{
			if(args.length===0){
				await build();
				await echo(2);
				return;
			}
			for(const arg of args) {
				if(actions[arg]) {
					await task(actions[arg], arg);
					await echo(2);
				} else {
					await echo(1,arg);
					process.exit(1);
				}
			}
		} catch(e) {
			process.exit(1);
		}
	},
	actions={
		build,
		clean,
		style,
		uncache,
	};
main();
