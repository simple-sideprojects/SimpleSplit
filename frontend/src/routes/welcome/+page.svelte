<script lang="ts">
	import { goto } from "$app/navigation";
	import { authStore } from "$lib/shared/stores/auth.store";
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import { Network } from "@capacitor/network";

    let visible = true;

    onMount(() => {
        setTimeout(async () => {
            Network.getStatus().then((status) => {
                visible = false;
                setTimeout(() => {
                    if($authStore.authenticated){
                        goto('/');
                    }else{
                        if(!status.connected){
                            goto('/offline');
                        }else{
                            goto('/auth/login');
                        }
                    }
                }, 400);
            });
        }, 1000);
    });
</script>

{#if visible}
    <div class="flex h-screen items-center justify-center" transition:fade={{ duration: 400 }}>
        <div
            class="flex w-full flex-col justify-center rounded-lg p-12 sm:w-md sm:px-6 lg:px-8"
        >
            <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                <img class="mx-auto h-10 w-auto" src="/simple-sideprojects.webp" alt="Simple Split" />
                <h2 class="mt-5 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
                    Welcome to Simple Split
                </h2>
                <!-- Source: https://cssloaders.github.io/ -->
                <span class="loader mt-5 mx-auto"></span>
            </div>
        </div>
    </div>
{/if}

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