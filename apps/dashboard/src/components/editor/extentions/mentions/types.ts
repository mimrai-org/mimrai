/**
 * Supported entity types for mentions
 * Add new entity types here to extend the mention system
 */
export type MentionEntityType =
	| "user"
	| "task"
	| "document"
	| "project"
	| "milestone"
	| "tool";

/**
 * Base interface for all mentionable entities
 */
export interface MentionableEntity {
	id: string;
	type: MentionEntityType;
	label: string;
	color?: string | null;
	/** Additional metadata that can be used for rendering */
	metadata?: Record<string, unknown>;
}

/**
 * User entity for mentions
 */
export interface UserMentionEntity extends MentionableEntity {
	type: "user";
	name: string;
	email?: string | null;
	image?: string | null;
}

/**
 * Task entity for mentions
 */
export interface TaskMentionEntity extends MentionableEntity {
	type: "task";
	title: string;
	sequence?: number | null;
	status?: string;
	completed?: boolean;
}

export interface DocumentMentionEntity extends MentionableEntity {
	type: "document";
	name: string;
	icon?: string | null;
}

export interface ToolMentionEntity extends MentionableEntity {
	type: "tool";
	name: string;
	description?: string | null;
}

/**
 * Project entity for mentions
 */
export interface ProjectMentionEntity extends MentionableEntity {
	type: "project";
	name: string;
}

/**
 * Milestone entity for mentions
 */
export interface MilestoneMentionEntity extends MentionableEntity {
	type: "milestone";
	name: string;
	projectId?: string | null;
}

/**
 * Union type of all mention entities
 */
export type AnyMentionEntity =
	| UserMentionEntity
	| TaskMentionEntity
	| DocumentMentionEntity
	| ProjectMentionEntity
	| MilestoneMentionEntity
	| ToolMentionEntity;

/**
 * Props for rendering a mention item in the suggestion list
 */
export interface MentionItemRendererProps<
	T extends MentionableEntity = AnyMentionEntity,
> {
	entity: T;
	isSelected: boolean;
}

/**
 * Props for the mention node component rendered in the editor
 */
export interface MentionNodeProps {
	id: string;
	type: MentionEntityType;
	label: string;
	attrs: Record<string, unknown>;
}

/**
 * Configuration for a mention entity type
 */
export interface MentionEntityConfig<
	T extends MentionableEntity = AnyMentionEntity,
> {
	/** The trigger character(s) for this entity type */
	char: string;
	/** The entity type identifier */
	type: MentionEntityType;
	/** Function to fetch entities matching the query */
	fetcher: (query: string) => Promise<T[]>;
	/** Component to render items in the suggestion list */
	listItemRenderer: React.ComponentType<MentionItemRendererProps<T>>;
	/** Component to render the mention in the editor */
	nodeRenderer: React.ComponentType<MentionNodeProps>;
	/** Placeholder text when no results are found */
	emptyPlaceholder?: string;
}
