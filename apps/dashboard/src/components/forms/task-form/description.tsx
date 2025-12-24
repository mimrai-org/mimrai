import type { Editor as EditorInstance } from "@tiptap/react";
import { FormControl, FormField, FormItem } from "@ui/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Editor } from "@/components/editor";

export const Description = ({
	editorRef,
}: {
	editorRef: React.Ref<EditorInstance>;
}) => {
	const form = useFormContext();
	const id = form.watch("id");

	return (
		<FormField
			control={form.control}
			name="description"
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<Editor
							className="editor-xl [&_.tiptap]:min-h-[100px]"
							placeholder="Add description..."
							taskId={id}
							value={field.value ?? ""}
							onChange={(value) => {
								field.onChange(value);
							}}
							shouldInsertImage={true}
							onUpload={async (url) => {
								const currentValue = form.getValues("attachments") ?? [];
								form.setValue("attachments", [...currentValue, url], {
									shouldDirty: true,
									shouldValidate: true,
								});
							}}
							ref={editorRef}
						/>
					</FormControl>
				</FormItem>
			)}
		/>
	);
};
