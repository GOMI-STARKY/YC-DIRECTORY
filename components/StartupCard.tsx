import { formatDate } from "@/lib/utils";
import { EyeIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type StartupTypeCard = {
  _id: string;
  _createdAt: string;
  title: string;
  slug: any;
  category: string;
  views: number;
  description: string;
  image: string;
  author?: {
    _id: string;
    name: string;
    image?: string;
    bio?: string;
  };
};

const StartupCard = ({ post }: { post: StartupTypeCard }) => {
  const {
    _createdAt,
    views,
    author,
    title,
    category,
    _id,
    image,
    description,
  } = post;

  return (
    <li className="startup-card group">
      <div className="flex-between">
        <p className="startup_card_date">{formatDate(_createdAt)}</p>
        <div className="flex gap-1.5">
          <EyeIcon className="size-6 text-primary" />
          <span className="text-16-medium">{views}</span>
        </div>
      </div>

      <div className="flex-between mt-5 gap-5">
        <div className="flex-1">
          {author && (
            <Link href={`/user/${author?._id}`}>
              <p className="text-16-medium line-clamp-1">{author?.name}</p>
            </Link>
          )}
          <Link href={`/startup/${_id}`}>
            <h3 className="text-26-semibold line-clamp-1">{title}</h3>
          </Link>
        </div>
        {author?.image && (
          <Link href={`/user/${author?._id}`}>
            <Image
              src={author?.image}
              alt={author?.name}
              width={48}
              height={48}
              className="rounded-full"
            />
          </Link>
        )}
      </div>

      <Link href={`/startup/${_id}`}>
        <p className="startup_card_desc">{description}</p>

        {image && (
          <div className="relative mt-5 w-full h-48">
            <Image
              src={image}
              alt={title || "Startup image"}
              fill
              className="rounded-[10px] object-cover"
              unoptimized={image.startsWith("data:")}
            />
          </div>
        )}
      </Link>

      <div className="flex-between gap-3 mt-5">
        <Link href={`/?query=${category?.toLowerCase()}`}>
          <p className="text-16-medium">{category}</p>
        </Link>
        <Button className="startup-card-btn" asChild>
          <Link href={`/startup/${_id}`}>Details</Link>
        </Button>
      </div>
    </li>
  );
};

export const StartupCardSkeleton = () => (
  <>
    {[0, 1, 2, 3, 4].map((index: number) => (
      <li key={cn("skeleton", index)}>
        <Skeleton className="startup-card_skeleton" />
      </li>
    ))}
  </>
);

export default StartupCard;