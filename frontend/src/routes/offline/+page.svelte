<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";
	import { fade } from "svelte/transition";
	import { Network } from "@capacitor/network";

	let checkTimeout: ReturnType<typeof setTimeout> | null = null;
	let checkInterval = 15; // Startintervall in Sekunden

	async function checkConnection() {
		const status = await Network.getStatus();
		
		if (status.connected) {
			// Bei Verbindung zur Welcome-Seite weiterleiten
			goto('/welcome');
		} else {
			// Intervall verdoppeln für den nächsten Check
			checkInterval = Math.min(checkInterval * 2, 3600); // Max 1 Stunde
			
			// Nächsten Check planen
			checkTimeout = setTimeout(checkConnection, checkInterval * 1000);
		}
	}

	function handleManualCheck() {
		// Timer zurücksetzen und sofort prüfen
		if (checkTimeout) {
			clearTimeout(checkTimeout);
		}
		checkConnection();
	}

	onMount(() => {
		// Ersten Check nach 15 Sekunden starten
		checkTimeout = setTimeout(checkConnection, checkInterval * 1000);
	});

	onDestroy(() => {
		// Timeout bei Komponentenzerstörung aufräumen
		if (checkTimeout) {
			clearTimeout(checkTimeout);
		}
	});
</script>

<div class="flex h-screen items-center justify-center" transition:fade={{ duration: 400 }}>
    <div
        class="flex w-full flex-col justify-center rounded-lg p-12 sm:w-md sm:px-6 lg:px-8"
    >
        <div class="sm:mx-auto sm:w-full sm:max-w-sm">
            <img class="mx-auto h-10 w-auto" src="/simple-sideprojects.webp" alt="Simple Split" />
            <h2 class="mt-5 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                Sie sind offline
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
                Die App benötigt eine Internetverbindung. Bitte stellen Sie Ihre Verbindung wieder her.
            </p>
            
            <div class="mt-6">
                <button
                    type="button"
                    onclick={handleManualCheck}
                    class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Verbindung prüfen
                </button>
            </div>
            
            <p class="mt-6 text-center text-xs text-gray-500">
                Nächste automatische Prüfung in {checkInterval} Sekunden
            </p>
            
            <!-- Loader -->
            <span class="loader mt-5 mx-auto"></span>
        </div>
    </div>
</div>

<style>
   .loader {
        width: 38px;
        height: 38px;
        border: 4px solid var(--color-gray-900);
        border-bottom-color: transparent;
        border-radius: 50%;
        display: flex;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    } 
</style>