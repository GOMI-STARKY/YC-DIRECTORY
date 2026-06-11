"use client"

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

const SearchFormReset = ({ onReset }: { onReset?: () => void }) => {
    const router = useRouter();

    const reset = () => {
        onReset?.();
        router.push("/");
    }
    return (
        <button type = "button" onClick={reset} className="search-btn text-white">
            <X className="size-5" />
        </button>
    )
}

export default SearchFormReset