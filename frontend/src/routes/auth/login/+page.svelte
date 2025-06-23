<script lang="ts">
	import { goto } from '$app/navigation';
	import { clientSideLogin } from '$lib/shared/stores/auth.store';
	import type { PageData } from './$types';
	import { superForm } from '$lib/shared/form/super-form';
	import IconLoader from '~icons/tabler/loader';
	import IconChevronDown from '~icons/tabler/chevron-down';
	import IconChevronUp from '~icons/tabler/chevron-up';
	import IconPlus from '~icons/tabler/plus';
	import { authStore } from '$lib/shared/stores/auth.store';
	import { PUBLIC_FRONTEND_URL, PUBLIC_FRONTEND_URL_CHANGABLE } from '$env/static/public';
	import { isCompiledStatic } from '$lib/shared/app/controller';

	//Get data from server
	const { data } = $props<{ data: PageData }>();

	//Login Form
	const { form, errors, enhance, message, constraints, submitting } = superForm(data.loginForm, {
		resetForm: false,
		onResult: async ({ result, cancel }) => {
			if (result.type !== 'success') {
				return;
			}

			if (result.data && result.data.token) {
				// Login-Funktion im Store aufrufen
				clientSideLogin(result.data.token, result.data.user);

				// Zur Hauptseite weiterleiten
				await goto('/');
			} else {
				cancel();
			}
		}
	});

	// Server Switcher
	const supportsServerSwitcher = isCompiledStatic() && PUBLIC_FRONTEND_URL_CHANGABLE === 'on';
	let SERVER_HOST = $derived(new URL($authStore.frontend_url || PUBLIC_FRONTEND_URL));
	let server_input = $state('');

	// Popover umschalten
	let showPopover = $state(false);
	let server_input_error = $state(false);
	let server_input_error_message = $state('');

	function togglePopover(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		showPopover = !showPopover;
	}

	// Klick außerhalb des Popovers schließt ihn
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const popover = document.getElementById('server-popover');
		const link = document.getElementById('server-link');

		if (popover && link && !popover.contains(target) && !link.contains(target)) {
			showPopover = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="flex h-screen items-center justify-center">
	<div
		class="flex w-full flex-col justify-center rounded-lg p-12 sm:w-md sm:border sm:border-gray-300 sm:px-6 lg:px-8"
	>
		<div class="sm:mx-auto sm:w-full sm:max-w-sm">
			<img class="mx-auto h-10 w-auto" src="/simple-sideprojects.webp" alt="Simple Split" />
			<h2 class="mt-8 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
				Sign in to your account
			</h2>
		</div>

		<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
			<form class="space-y-6" method="POST" use:enhance action="?/login">
				{#if $message}
					<div class="rounded-md bg-red-50 p-4">
						<div class="flex">
							<div class="text-sm text-red-700">
								{$message}
							</div>
						</div>
					</div>
				{/if}

				<div>
					<label for="email" class="block text-sm/6 font-medium text-gray-900">Email Address</label>
					<div class="mt-2">
						<input
							type="email"
							name="email"
							id="email"
							autocomplete="email"
							tabindex="0"
							required
							bind:value={$form.email}
							class="w-full rounded border px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 sm:text-sm/6 {$errors.email
								? 'border-red-500'
								: 'border-gray-300'}"
							aria-invalid={$errors.email ? 'true' : 'false'}
							{...$constraints.email}
						/>
						{#if $errors.email}
							<p class="mt-1 text-sm text-red-600">This is not a valid email address</p>
						{/if}
					</div>
				</div>

				<div>
					<div class="flex items-center justify-between">
						<label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
						<div class="text-sm">
							<a href="#" class="font-semibold text-blue-600 hover:text-blue-800" tabindex="-1">
								Forgot password?
							</a>
						</div>
					</div>
					<div class="mt-2">
						<input
							type="password"
							name="password"
							id="password"
							autocomplete="current-password"
							tabindex="0"
							required
							bind:value={$form.password}
							class="w-full rounded border px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 sm:text-sm/6 {$errors.password
								? 'border-red-500'
								: 'border-gray-300'}"
							aria-invalid={$errors.password ? 'true' : 'false'}
						/>
						{#if $errors.password}
							<p class="mt-1 text-sm text-red-600">This is not a valid password</p>
						{/if}
					</div>
				</div>

				<div>
					<button
						type="submit"
						disabled={$submitting}
						tabindex="0"
						class="flex w-full cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
					>
						{#if $submitting}
							<IconLoader class="mr-2 size-4 animate-spin" />
							Signing in...
						{:else}
							Sign in
						{/if}
					</button>
				</div>
				<p class="text-center text-sm/6 text-gray-500">
					Not a member?
					<a href="/auth/register" class="font-semibold text-blue-600 hover:text-blue-500"
						>Register here</a
					>
				</p>
				{#if supportsServerSwitcher}
					<p class="mt-4 mb-0 text-center text-sm/6 text-gray-500">
						Zugriff auf:
						<span class="relative">
							<a
								id="server-link"
								class="inline-flex cursor-pointer items-center font-semibold text-blue-600 hover:text-blue-500"
								href="#"
								onclick={togglePopover}
							>
								{SERVER_HOST.hostname}{#if SERVER_HOST.port !== ''}:{SERVER_HOST.port}{/if}
								{#if showPopover}
									<IconChevronUp class="ml-1 inline-flex size-4 text-gray-500" />
								{:else}
									<IconChevronDown class="ml-1 inline-flex size-4 text-gray-500" />
								{/if}
							</a>
						</span>
					</p>
				{/if}
				{#if supportsServerSwitcher && showPopover}
					<div
						id="server-popover"
						class="absolute left-1/2 z-50 mt-2 w-64 -translate-x-1/2 transform rounded-lg border border-gray-200 bg-white shadow-lg"
					>
						<div class="p-3">
							<h3 class="text-sm font-medium">Server-Auswahl</h3>
							<p class="mt-1 text-xs text-gray-500">Wähle eine Server-Instanz für den Zugriff</p>
						</div>

						{#if $authStore.frontend_url !== PUBLIC_FRONTEND_URL}
							<div class="max-h-48 overflow-y-auto pb-3">
								<button
									class="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
									onclick={() => {
										$authStore.frontend_url = PUBLIC_FRONTEND_URL;
										showPopover = false;
									}}
								>
									<div>
										<div class="text-sm font-medium">{PUBLIC_FRONTEND_URL}</div>
										<div class="text-xs text-gray-500">SimpleSplit (default)</div>
									</div>
								</button>
							</div>
						{/if}
						{#if server_input_error}
							<div class="rounded-md bg-red-50 p-4">
								<div class="flex">
									<div class="text-sm text-red-700">{server_input_error_message}</div>
								</div>
							</div>
						{/if}
						<div class="p-3 pt-0">
							<div class="space-y-2">
								<div>
									<input
										type="url"
										placeholder="Server URL (eg. https://example.com)"
										bind:value={server_input}
										class="w-full rounded-lg border border-gray-200 p-1.5 text-sm"
									/>
								</div>
								<button
									type="button"
									class="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
									onclick={(e) => {
										e.preventDefault();
										try {
											//Validate URL
											let server_input_url = new URL(server_input);
											server_input_error = false;
											let new_frontend_url = server_input_url.toString();
											if (new_frontend_url.endsWith('/')) {
												new_frontend_url = new_frontend_url.slice(0, -1);
											}
											$authStore.frontend_url = new_frontend_url;
											server_input = '';
											showPopover = false;
										} catch (error) {
											if (server_input == '') {
												server_input_error_message = 'Server URL is required';
											} else if (
												!server_input.includes('http://') &&
												!server_input.includes('https://')
											) {
												server_input_error_message = 'Missing Schema (http:// or https://)';
											} else {
												server_input_error_message = 'Failed to validate URL';
											}
											server_input_error = true;
										}
										return server_input_error;
									}}
								>
									<IconPlus class="size-4" />
									Server ändern
								</button>
							</div>
						</div>
					</div>
				{/if}
			</form>
		</div>
	</div>
</div>
