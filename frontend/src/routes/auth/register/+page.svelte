<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onPageLoad } from '$lib/shared/app/controller.js';
	import { clientSideLogin } from '$lib/shared/stores/auth.store.js';
	import { onMount } from 'svelte';
	import { superForm } from '$lib/shared/form/super-form';
	import IconLoader from '~icons/tabler/loader';

	const { data } = $props();

	const { form, errors, enhance, submit, message, submitting } = superForm(data.form, {
		resetForm: false,
		onResult: async ({ result }) => {
			if (result.type !== 'success'){
				return;
			}

			if (browser && result.data?.token) {
				// Login-Funktion im Store aufrufen
				clientSideLogin(result.data.token);

				// Zur Hauptseite weiterleiten
				await goto('/');
			}
		},
		onError({ result }) {
			if (result.type === 'error') {
				message.set('An error occurred while registering');
			} else if (result.type === 'exception') {
				console.error('Form submission exception:', result.error);
				message.set('An unexpected error occurred while registering');
			}
		}
	});

	onMount(async () => {
		await onPageLoad(false, false);
	});
</script>

<div class="flex h-screen items-center justify-center">
	<div
		class="flex w-full flex-col justify-center rounded-lg p-12 sm:w-md sm:border sm:border-gray-300 sm:px-6 lg:px-8"
	>
		<div class="sm:mx-auto sm:w-full sm:max-w-sm">
			<img class="mx-auto h-10 w-auto" src="/simple-sideprojects.webp" alt="Simple Split" />
			<h2 class="mt-8 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
				Register a new account
			</h2>
		</div>

		<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
			<form class="space-y-6" method="POST" use:enhance action="?/register">
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
					<label for="username" class="block text-sm/6 font-medium text-gray-900">
						Username <span class="text-xs text-gray-500">(optional)</span>
					</label>
					<div class="mt-2">
						<input
							type="text"
							name="username"
							id="username"
							autocomplete="username"
							bind:value={$form.username}
							class="w-full rounded border px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 sm:text-sm/6 {$errors.username
								? 'border-red-500'
								: 'border-gray-300'}"
						/>
						{#if $errors.username}
							<p class="mt-1 text-sm text-red-600">This is not a valid username</p>
						{/if}
					</div>
				</div>

				<div>
					<label for="email" class="block text-sm/6 font-medium text-gray-900">Email Address</label>
					<div class="mt-2">
						<input
							type="email"
							name="email"
							id="email"
							autocomplete="email"
							required
							bind:value={$form.email}
							class="w-full rounded border px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 sm:text-sm/6 {$errors.email
								? 'border-red-500'
								: 'border-gray-300'}"
							aria-invalid={$errors.email ? 'true' : 'false'}
						/>
						{#if $errors.email}
							<p class="mt-1 text-sm text-red-600">This is not a valid email address</p>
						{/if}
					</div>
				</div>

				<div>
					<label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
					<div class="mt-2">
						<input
							type="password"
							name="password"
							id="password"
							autocomplete="new-password"
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
						class="flex w-full cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
					>
						{#if $submitting}
							<IconLoader class="mr-2 size-4 animate-spin" />
							Registering...
						{:else}
							Register
						{/if}
					</button>
				</div>
			</form>

			<p class="mt-10 text-center text-sm/6 text-gray-500">
				Already a member?
				<a href="/auth/login" class="font-semibold text-blue-600 hover:text-blue-500">Sign in</a>
			</p>
		</div>
	</div>
</div>
