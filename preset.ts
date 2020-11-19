import { Preset, color } from 'use-preset';

interface Context {
	presetName: string;
	packages: string[];
	options: string[];
	uninstallUi?: boolean;
}

const packageName = (name: string) => `laravel-frontend-presets/${name}`;

// Sets the name.
Preset.setName<Context>(({ context: { presetName } }) => packageName(presetName));

// Sets up the context with the arguments and options given.
Preset.hook<Context>(({ context, args, options }) => {
	context.presetName = args[2];

	if (!context.presetName) {
		throw new Error(`The preset name is missing.`);
	}

	context.packages = ['laravel/ui', packageName(context.presetName), ...(options.deps ?? [])];
	context.options = Object.keys(options)
		.filter((option) => ['auth'].includes(option))
		.map((option) => `--${option}`);

	if (context.presetName === 'tall') {
		context.packages.push('livewire/livewire');
		context.uninstallUi = true;
	}
}).withoutTitle();

// Requires the packages.
Preset.execute<Context>('composer')
	.withArguments(({ context }) => ['require', ...context.packages])
	.withTitle(`Installing ${color.magenta('laravel/ui')}...`);

// Executes the Artisan commands.
Preset.execute<Context>('php')
	.withArguments(({ context }) => ['artisan', 'ui', context.presetName, ...context.options])
	.withTitle(({ context }) => `Applying ${color.magenta(packageName(context.presetName))}...`);

// Requires the packages.
Preset.execute<Context>('composer', 'remove', 'larave/ui')
	.withTitle(`Removing ${color.magenta('laravel/ui')}...`)
	.if(({ context }) => Boolean(context.uninstallUi));

// Displays instructions.
Preset.instruct([
	`Install dependencies ${color.magenta('npm install')} or ${color.magenta('yarn')}`,
	`Run ${color.magenta('npm run dev')} or ${color.magenta('yarn dev')}`,
]);
