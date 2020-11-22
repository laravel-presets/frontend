import { Preset, color } from 'use-preset';

interface Context {
	presetName: string;
	presetTitle: string;
	install: string[];
	command: string[];
	uninstall: string[];
	options: string[];
}

const formatPackageList = (packages: string[]) => {
	return packages
		.map((name) => color.magenta(name))
		.join(', ')
		.replace(/,(?!.*,)/gim, ' and');
};

// Sets the name.
Preset.setName<Context>(({ context }) => context.presetTitle);

// Sets up the context with the arguments and options given.
Preset.hook<Context>(({ context, args, options }) => {
	context.presetName = args[2];
	context.install = [];
	context.uninstall = [];
	context.options = Object.keys(options)
		.filter((option) => ['auth', 'extra'].includes(option))
		.map((option) => `--${option}`);

	if (!context.presetName) {
		throw new Error(`The preset name is missing.`);
	}

	switch (context.presetName) {
		// Actual laravel/ui presets
		case 'bootstrap':
		case 'vue':
		case 'react':
			context.presetTitle = context.presetName;
			context.install.push('laravel/ui');
			context.command = ['artisan', 'ui', context.presetName, ...context.options];
			break;

		// Support for Breeze
		case 'breeze':
			context.presetTitle = `laravel/breeze`;
			context.install.push('laravel/breeze');
			context.uninstall.push('laravel/breeze');
			context.command = ['artisan', 'breeze:install'];
			break;

		// Special TALL handling
		case 'tall':
			context.install.push('livewire/livewire');
			context.uninstall.push('laravel/ui');

		// Common to all laravel-frontend-presets
		default:
			const packageName = `laravel-frontend-presets/${context.presetName}`;
			context.presetTitle = packageName;
			context.install.push('laravel/ui', packageName);
			context.uninstall.push(packageName);
			context.command = ['artisan', 'ui', context.presetName, ...context.options];
	}
}).withoutTitle();

// Requires the packages.
Preset.execute<Context>('composer')
	.withArguments(({ context }) => ['require', ...context.install])
	.withTitle(({ context }) => `Installing ${formatPackageList(context.install)}...`);

// Executes the Artisan commands.
Preset.execute<Context>('php')
	.withArguments(({ context }) => context.command)
	.withTitle(({ context }) => `Applying ${color.magenta(context.presetTitle)}...`);

// Removes the packages.
Preset.execute<Context>('composer')
	.withArguments(({ context }) => ['remove', ...context.uninstall])
	.withTitle(({ context }) => `Removing ${formatPackageList(context.uninstall)}...`)
	.if(({ context }) => context.uninstall.length > 0);

// Displays instructions.
Preset.instruct([
	`Install dependencies ${color.magenta('npm install')} or ${color.magenta('yarn')}`,
	`Run ${color.magenta('npm run dev')} or ${color.magenta('yarn dev')}`,
]);
