<div class="flex h-screen items-center justify-center">
	<div class="flex flex-col justify-center rounded-lg border border-gray-300 px-6 py-12 lg:px-8">
		<div class="sm:mx-auto sm:w-full sm:max-w-sm">
			<img class="mx-auto h-10 w-auto" src="/simple-sideprojects.webp" alt="Simple Split" />
			<h2 class="mt-8 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
				Sign in to your account
			</h2>
		</div>

		<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
			<form class="space-y-6" action="#" method="POST">
				<div>
					<label for="email" class="block text-sm/6 font-medium text-gray-900">Email Address</label>
					<div class="mt-2">
						<input
							type="email"
							name="email"
							id="email"
							autocomplete="email"
							required
							class="w-full rounded border border-gray-300 px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 sm:text-sm/6"
						/>
					</div>
				</div>

				<div>
					<div class="flex items-center justify-between">
						<label for="password" class="block text-sm/6 font-medium text-gray-900">Password</label>
						<div class="text-sm">
							<a href="#" class="font-semibold text-blue-600 hover:text-blue-800"
								>Forgot password?</a
							>
						</div>
					</div>
					<div class="mt-2">
						<input
							type="password"
							name="password"
							id="password"
							autocomplete="current-password"
							required
							class="w-full rounded border border-gray-300 px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 sm:text-sm/6"
						/>
					</div>
				</div>

				<div>
					<button
						type="submit"
						class="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
						>Sign in</button
					>
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
