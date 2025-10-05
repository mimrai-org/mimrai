"use client";

import { getAppUrl } from "@mimir/utils/envs";
import Link from "next/link";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { Table } from "../ui/table";

type ResponseProps = ComponentProps<typeof Streamdown>;

// Custom ul component with customizable className
const CustomUnorderedList = ({
	node,
	children,
	className,
	...props
}: {
	node?: any;
	children?: React.ReactNode;
	className?: string;
}) => (
	<ul className={cn("m-0 list-none p-0", className)} {...props}>
		{children}
	</ul>
);

// Custom ol component with customizable className (no numbers)
const CustomOrderedList = ({
	node,
	children,
	className,
	...props
}: {
	node?: any;
	children?: React.ReactNode;
	className?: string;
}) => (
	<ol
		className={cn("m-0 list-none p-0", className)}
		{...props}
		data-streamdown="unordered-list"
	>
		{children}
	</ol>
);

// Custom li component to remove padding
const CustomListItem = ({
	node,
	children,
	className,
	...props
}: {
	node?: any;
	children?: React.ReactNode;
	className?: string;
}) => (
	<li
		className={cn("my-0 py-0 leading-none", className)}
		{...props}
		data-streamdown="list-item"
	>
		{children}
	</li>
);

export const Response = memo(
	({ className, ...props }: ResponseProps) => (
		<Streamdown
			className={cn(
				"size-full space-y-4 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
				className,
			)}
			components={{
				ul: (props) => <CustomUnorderedList {...props} />,
				ol: (props) => <CustomOrderedList {...props} />,
				li: (props) => <CustomListItem {...props} />,
				h2: ({ children, node, ...props }) => (
					<h3
						className="font-medium text-primary text-sm tracking-wide"
						{...props}
					>
						{children}
					</h3>
				),
				h3: ({ children, node, ...props }) => (
					<h3
						className="font-medium text-primary text-sm tracking-wide"
						{...props}
					>
						{children}
					</h3>
				),
				h4: ({ children, node, ...props }) => (
					<h4
						className="font-medium text-primary text-sm tracking-wide"
						{...props}
					>
						{children}
					</h4>
				),
				table: (props) => <Table {...props} className="border" />,
				a: (props) => {
					// if the href starts with the app url, open in the same window
					if (props.href?.startsWith(getAppUrl())) {
						return (
							<Link href={props.href} className="underline">
								{props.children}
							</Link>
						);
					}

					return <a {...props} />;
				},
			}}
			{...props}
		/>
	),
	(prevProps, nextProps) => prevProps.children === nextProps.children,
);

Response.displayName = "Response";
