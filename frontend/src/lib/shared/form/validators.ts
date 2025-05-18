import { z } from "zod";

export const zEmailPasswordLogin = z.object({
	email: z.string().email(),
	password: z.string()
});

export const passwordFormSchema = z
    .object({
        old_password: z.string().min(1, 'Current password is required'),
        new_password: z.string().min(8, 'New password must be at least 8 characters long'),
        confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters long')
    })
    .refine((data) => data.new_password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
    });

export const deleteAccountSchema = z.object({
    deleteConfirmation: z.string().min(1, 'Confirmation is required')
});

export const zCreateGroup = z.object({
	name: z.string().min(1)
});