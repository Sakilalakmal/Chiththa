export type TaskStatus = 'todo' | 'done';
export type ReadLinkSource = 'reddit' | 'medium' | 'other';

export type DbBoolean = 0 | 1;

export type Task = {
  id: string;
  title: string;
  content: string | null;
  status: TaskStatus;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VoiceNote = {
  id: string;
  transcriptText: string | null;
  audioPath: string;
  duration: number | null;
  createdAt: string;
};

export type ReadLink = {
  id: string;
  title: string | null;
  url: string;
  source: ReadLinkSource;
  tags: string | null;
  savedAt: string;
  lastOpenedAt: string | null;
};

export type CreateTaskInput = {
  title: string;
  content?: string | null;
};

export type UpdateTaskPatch = {
  title?: string;
  content?: string | null;
  status?: TaskStatus;
  pinned?: boolean;
};

export type ListTasksOptions = {
  status?: TaskStatus;
  pinned?: boolean;
  search?: string;
  limit?: number;
};

export type CreateVoiceNoteInput = {
  transcriptText?: string | null;
  audioPath: string;
  duration?: number | null;
};

export type UpdateVoiceNotePatch = {
  transcriptText?: string | null;
  audioPath?: string;
  duration?: number | null;
};

export type ListVoiceNotesOptions = {
  search?: string;
  limit?: number;
};

export type CreateReadLinkInput = {
  url: string;
  title?: string | null;
  source: ReadLinkSource;
  tags?: string | null;
};

export type UpdateReadLinkPatch = {
  url?: string;
  title?: string | null;
  source?: ReadLinkSource;
  tags?: string | null;
  lastOpenedAt?: string | null;
};

export type ListReadLinksOptions = {
  source?: ReadLinkSource;
  search?: string;
  limit?: number;
};
