import type { ZodValidation } from 'sveltekit-superforms';
import { superForm as realSuperForm } from 'sveltekit-superforms/client';
import type { AnyZodObject } from 'zod';
import { isCompiledStatic, createCustomRequestForFormAction } from '$lib/shared/app/controller';

export function superForm<T extends ZodValidation<AnyZodObject>>(
    ...params: Parameters<typeof realSuperForm<T, Message>>
) {
    return realSuperForm<T, Message>(params[0], {
        ...params[1],
        onSubmit: (event) => {
            if(isCompiledStatic()){
                event.customRequest(createCustomRequestForFormAction);
            }
            if(params[1].onSubmit !== undefined){
                params[1].onSubmit(event);
            }
        }
    });
}
