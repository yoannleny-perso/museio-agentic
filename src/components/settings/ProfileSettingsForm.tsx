import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from "@/context/ProfileContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";

// Define industry categories
const industryCategories = [
  "Music",
  "Photography",
  "Film & Video",
  "Design",
  "Visual Arts",
  "Performing Arts",
  "Writing",
  "Architecture",
  "Fashion",
  "Culinary Arts",
  "Technology",
  "Education",
  "Marketing",
  "Media",
  "Entertainment",
  "Event Management",
  "Other",
];

// Schema
const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  nickname: z.string().optional(),
  username: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^[a-z0-9]+$/.test(val),
      "Only lowercase letters (a–z) and numbers (0–9) are allowed."
    )
    .refine(
      (val) => val === "" || val.length >= 3,
      "Username must be at least 3 characters"
    )
    .refine(
      (val) => val === "" || val.length <= 20,
      "Username must be less than 20 characters"
    ),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  industry: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  abn: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileSettingsForm = () => {
  const { profileData, saveProfile, loading, isSaving } = useProfile();
  const { user } = useAuth();
  const [usernameError, setUsernameError] = useState<string>("");
  const [checkingUsername, setCheckingUsername] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange", // live validation!
    defaultValues: {
      firstName: "",
      lastName: "",
      nickname: "",
      username: "",
      email: "",
      phone: "",
      industry: "",
      companyName: "",
      companyAddress: "",
      abn: "",
    },
  });
  const watchedUsername = form.watch("username");

  React.useEffect(() => {
    if (!watchedUsername || watchedUsername.length < 3 || !user) {
      setUsernameError("");
      setCheckingUsername(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", watchedUsername)
          .neq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        setUsernameError(data ? "This username is already taken" : "");
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameError("Error checking username availability");
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user, watchedUsername]);

  // Populate form
  React.useEffect(() => {
    if (profileData) {
      form.reset({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        nickname: profileData.nickname || "",
        username: profileData.username || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        industry: profileData.industry || "",
        companyName: profileData.companyName || "",
        companyAddress: profileData.companyAddress || "",
        abn: profileData.abn || "",
      });
    }
  }, [profileData, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (usernameError) return;

    await saveProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      nickname: data.nickname || "",
      username: data.username || "",
      email: data.email,
      phone: data.phone || "",
      industry: data.industry || "",
      companyName: data.companyName || "",
      companyAddress: data.companyAddress || "",
      abn: data.abn || "",
    });
  };

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6]" />
        <span className="ml-2 text-gray-600">Loading profile information...</span>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
      <h2 className="text-lg font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent mb-4">
        Personal Information
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nickname (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Your nickname" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value);
                    }}
                    placeholder="Enter a unique username"
                  />
                </FormControl>
                <FormMessage />
                {checkingUsername && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking availability...
                  </div>
                )}
                {usernameError && (
                  <p className="text-sm text-red-500 mt-1">{usernameError}</p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Your email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Your phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-[100] bg-white">
                    {industryCategories.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-t border-gray-200 pt-4 mt-6">
            <h3 className="text-lg font-medium bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent mb-4">
              Business Information (Optional)
            </h3>

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business/Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Your business address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ABN</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Australian Business Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <PrimaryActionButton
            type="submit"
            width="full"
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save Profile Information
          </PrimaryActionButton>
        </form>
      </Form>
    </div>
  );
};

export default ProfileSettingsForm;
