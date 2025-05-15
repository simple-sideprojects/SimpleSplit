<script lang="ts">
	import { goto } from '$app/navigation';
	import { clientSideLogin } from '$lib/shared/stores/auth.store';
	import { browser } from '$app/environment';
	import { onPageLoad } from '$lib/shared/app/controller';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { superForm } from '$lib/shared/form/super-form';
	import IconLoader from '~icons/tabler/loader';

	const { data } = $props<{ data: PageData }>();

	const { form, errors, enhance, message, constraints, submitting } = superForm(data.form, {
		resetForm: false,
		onResult: async ({ result, cancel }) => {
			if (result.type !== 'success'){
				return;
			}

			if (result.data && result.data.token) {
				// Login-Funktion im Store aufrufen
				clientSideLogin(result.data.token);

				// Zur Hauptseite weiterleiten
				await goto('/');
			}else{
				cancel();
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
						class="flex w-full cursor-pointer justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
					>
						{#if $submitting}
							<IconLoader class="mr-2 size-4 animate-spin" />
							Signing in...
						{:else}
							Sign in
						{/if}
					</button>
				</div>
			</form>
			<p class="mt-10 text-center text-sm/6 text-gray-500">
				Not a member?
				<a href="/auth/register" class="font-semibold text-blue-600 hover:text-blue-500"
					>Register here</a
				>
			</p>
		</div>
	</div>
</div>
