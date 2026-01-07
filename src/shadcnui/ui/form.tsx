"use client";

import { FormProvider } from "react-hook-form";

/**
 * Form component is a wrapper around react-hook-form's FormProvider.
 * Use this to wrap your form and spread the form object into it.
 *
 * @example
 * const form = useForm<FormValues>();
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormInput form={form} id="email" name="Email" />
 *     </form>
 *   </Form>
 * );
 */
const Form = FormProvider;

export { Form };
