import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const PasswordSettingsForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const provider = user?.app_metadata?.provider;
  const isGoogleAccount = provider === "google";
  const passwordFormSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(
            isGoogleAccount ? 0 : 1,
            isGoogleAccount
              ? { message: "Current password is required if you already have one set" }
              : { message: "Current password is required" }
          ),
          newPassword: z
            .string()
            .min(8, { message: "Password must be at least 8 characters long" }),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          path: ["confirmPassword"],
          message: "Passwords do not match",
        })
        .refine((data) => data.currentPassword !== data.newPassword, {
          path: ["newPassword"],
          message: "New password must be different from your current password",
        }),
    [isGoogleAccount]
  );

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in again before changing your password.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    form.clearErrors("currentPassword");

    try {
      if (!user.email) {
        throw new Error("No email address is available for this account.");
      }

      const { data: verificationData, error: verificationError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: data.currentPassword,
        });

      if (verificationError) {
        form.setError("currentPassword", {
          type: "manual",
          message: "Current password is incorrect.",
        });
        toast({
          title: "Could not update password",
          description: "Current password is incorrect.",
          variant: "destructive",
        });
        return;
      }

      if (verificationData.user?.id !== user.id) {
        form.setError("currentPassword", {
          type: "manual",
          message: "Could not verify your current password.",
        });
        toast({
          title: "Could not update password",
          description: "Could not verify your current password.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Password updated",
        description: isGoogleAccount
          ? "Your password has been set. You can now sign in with Google or email and password."
          : "Your password was changed successfully.",
      });

      form.reset();
    } catch (error: any) {
      toast({
        title: "Could not update password",
        description:
          error?.message || "An unexpected error occurred while updating your password.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
          <LockKeyhole className="h-4 w-4 text-[#8B5CF6]" />
        </div>
        <div>
          <h2 className="text-lg font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">
            Password & Security
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isGoogleAccount
              ? "Set a password if you also want to sign in with email and password."
              : "Update the password you use to sign in to Museio."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter your current password"
                      autoComplete="current-password"
                      className="pr-12"
                      onChange={(event) => {
                        form.clearErrors("currentPassword");
                        field.onChange(event);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowCurrentPassword((value) => !value)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showCurrentPassword ? "Hide current password" : "Show current password"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter a new password"
                      autoComplete="new-password"
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword((value) => !value)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showNewPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="text-xs text-gray-500">
            Enter your current password first, then choose a new one with at least 8 characters.
          </p>

          <PrimaryActionButton
            type="submit"
            width="full"
            isLoading={isSaving}
            loadingText="Updating password..."
          >
            Update Password
          </PrimaryActionButton>
        </form>
      </Form>
    </div>
  );
};

export default PasswordSettingsForm;
