<script lang="ts">
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
	import { isCompiledStatic, onPageLoad } from "$lib/shared/app/controller";
	import { building } from "$app/environment";

	//Handle provided data
    const token = building || !page.url.searchParams.has("token") ? null : page.url.searchParams.get("token") as string;
    
	//Mobile App functionality
    onMount(async () => {
		if(!isCompiledStatic()){
			return;
		}
        if (!token) {
            goto("/groups");
        }
        
		await onPageLoad(true, true, {
            token
        });
    });
</script>

<div>
    <p>Your invite is being processed. Please wait...</p>
</div>