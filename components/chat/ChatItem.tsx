"use client";

import { Member, MemberRole, Profile } from "@prisma/client";
import UserAvatar from "../UserAvatar";
import { Edit, FileIcon, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import ActionTooltip from "../actionTooltip";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormItem, FormField } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useModal } from "@/Hooks/use-modal-hook";
import { useParams, useRouter } from "next/navigation";
import Linkify from "react-linkify"; // Import Linkify

interface ChatItemProps {
  id: string;
  content: string;
  member: Member & { profile: Profile };
  fileUrl: string;
  deleted: boolean;
  timeStamp: string;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
}

// Form schema for validation
const formSchema = z.object({
  content: z.string().min(1),
});

export const ChatItem = ({
  id,
  content,
  member,
  fileUrl,
  deleted,
  currentMember,
  isUpdated,
  socketQuery,
  socketUrl,
  timeStamp,
}: ChatItemProps) => {
  const roleIconMap: any = {
    GUEST: null,
    MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-green-500" />,
    ADMIN: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
  };

  const { onOpen } = useModal();
  const filetype = fileUrl?.split(".").pop();
  const isAdmin = currentMember.role === MemberRole.ADMIN;
  const isModerator = currentMember.role === MemberRole.MODERATOR;
  const isOwner = currentMember.id === member.id;
  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
  const canEditMessage = !deleted && isOwner && !fileUrl;
  const isPDF = filetype === "pdf" && fileUrl;
  const isImage = !isPDF && fileUrl;
  const params = useParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: content,
    },
  });

  const isLoading = form.formState.isLoading;

  useEffect(() => {
    const handleKeydown = (e: any) => {
      if (e.key === "Escape" || e.keyCode === 27) {
        setIsEditing(false);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const onMemberClick = () => {
    if (member.id === currentMember.id) {
      return;
    }
    router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      form.reset();
      setIsEditing(false);
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });
      await axios.patch(url, values);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    form.reset({
      content: content,
    });
  }, [content]);

  // Function to detect and render hyperlinks
  const renderContentWithLinks = (text: string) => {
    return (
      <Linkify
        componentDecorator={(decoratedHref, decoratedText, key) => (
          <a
            href={decoratedHref}
            key={key}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {decoratedText}
          </a>
        )}
      >
        {text}
      </Linkify>
    );
  };

  return (
    <div className="w-full relative group hover:bg-black/5 flex items-center p-4 transition">
      <div className="group flex items-start gap-x-2 w-full">
        <div className="cursor-pointer" onClick={onMemberClick}>
          <UserAvatar src={member.profile.imageUrl} />
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-x-2">
            <div
              onClick={onMemberClick}
              className="flex items-center hover:underline cursor-pointer font-semibold text-sm"
            >
              <p>{member.profile.name}</p>
              <ActionTooltip label={member.role}>
                {roleIconMap[member.role]}
              </ActionTooltip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timeStamp}
            </span>
          </div>

          {/* Image File Display */}
          {isImage && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-48 h-48 bg-secondary rounded-md mt-2 flex items-center relative aspect-square"
            >
              <Image src={fileUrl} alt={content} fill className="object-cover" />
            </a>
          )}

          {/* PDF File Display */}
          {isPDF && (
            <div className="relative flex items-center p-2 mt-4 bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400 " />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm ml-2 hover:underline text-indigo-500 dark:text-indigo-400"
              >
                PDF file
              </a>
            </div>
          )}

          {/* Display Text Content with Hyperlinks */}
          {!fileUrl && !isEditing && (
            <p
              className={cn(
                "text-sm text-zinc-600 dark:text-zinc-300",
                deleted && "italic text-zinc-500 dark:text-zinc-400 mt-1"
              )}
            >
              {renderContentWithLinks(content)}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (edited)
                </span>
              )}
            </p>
          )}

          {/* Editing Mode */}
          {!fileUrl && isEditing && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-x-2">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            disabled={isLoading}
                            className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                            placeholder="Edited message"
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button size="sm" variant="primary" disabled={isLoading}>
                  Save
                </Button>
              </form>
              <span className="text-zinc-400 text-[10px] mt-1">
                Press ESC to cancel, press enter to Save
              </span>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};
