import type React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps extends React.PropsWithChildren {
	open: boolean;
	title: string;
	description: string;
	onOpenChange: (open: boolean) => void;
}

export const Modal: React.FC<ModalProps> = ({
	open,
	title,
	description,
	onOpenChange,
	children,
}) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
};
