import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "#/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "#/components/ui/form";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth-client";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const [showVerificationScreen, setShowVerificationScreen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
      },
      {
        onSuccess: () => {
          setUserEmail(values.email);
          setShowVerificationScreen(true);
          toast.success("Account created! Please check your email.");
        },
        onError: (error) => {
          toast.error(error.error.message || error.error.statusText);
        },
      },
    );
  };

  // Show verification screen after successful signup
  if (showVerificationScreen) {
    return (
      <div className="mx-auto w-full mt-10 max-w-md p-6">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="rounded-full bg-indigo-100 p-6">
            <Mail className="h-12 w-12 text-indigo-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="text-gray-600">
              We've sent a verification link to
            </p>
            <p className="font-semibold text-indigo-600">{userEmail}</p>
          </div>

          <div className="space-y-4 w-full">
            <p className="text-sm text-gray-500">
              Click the link in the email to verify your account and get started.
            </p>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">
                Didn't receive the email?
              </p>
              <p className="text-xs text-gray-400">
                Check your spam folder or contact support if you need help.
              </p>
            </div>
          </div>

          <Button
            variant="link"
            onClick={onSwitchToSignIn}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Create Account</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input className="h-10" placeholder="Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Email"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Password"
                    className="h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Submitting..." : "Sign Up"}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignIn}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Already have an account? Sign In
        </Button>
      </div>
    </div>
  );
}
