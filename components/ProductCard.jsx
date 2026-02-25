"use client";
import { deleteProduct } from "@/app/actions";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader
} from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

const ProductCard = ({ product }) => {

    const [showChart, setShowChart] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Remove this product from tracking?")) return;

        setDeleting(true);
        const result = await deleteProduct(product.id);

        if (result.error) {
            toastst.error(result.error);
        }
        else {
            toast.success(result.message || "Product deleted successfully");
            setUrl("");
        }

        setDeleting(false);
    }
    return (
        <Card className={"hover:shadow-lg transition-shadow"}>
            <CardHeader className={"pb-3"}>
                <div className="flex gap-4">
                    {
                        product.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded-md border" />
                        )
                    }

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                            {product.name}
                        </h3>

                        <div className="flex items-baseline gap-2"></div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p>Card Content</p>
            </CardContent>
            <CardFooter>
                <p>Card Footer</p>
            </CardFooter>
        </Card>
    )
}

export default ProductCard;