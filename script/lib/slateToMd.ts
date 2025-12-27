export interface ReviewSlate {
  document?: Document;
}

export interface Document {
  object: 'document';
  children: readonly Paragraph[];
}

export interface Paragraph {
  data: Record<string, never>;
  type: 'paragraph';
  object: 'block';
  children: readonly ParagraphChild[];
}

export type ParagraphChild =
  | {
      text: string;
      object?: 'text';
      italic?: boolean;
      spoiler?: boolean;
    }
  | {
      object: 'inline';
      type: 'br';
      children: never[];
      data: Record<string, never>;
    };

const slateToMd = (slate: ReviewSlate): string =>
  slate.document?.children
    .flatMap((para) =>
      para.children
        // eslint-disable-next-line array-callback-return, consistent-return
        .map((child, i, arr): string => {
          switch (child.object) {
            case 'inline':
              switch (child.type) {
                case 'br':
                  return '\n';
              }
            // This doesn't actually fall through
            // eslint-disable-next-line no-fallthrough
            default: {
              const prev = arr.at(i - 1);
              const next = arr.at(i + 1);
              let { text, italic, spoiler } = child;
              if (italic) {
                const prevItalic = prev?.object === 'text' && prev.italic === true;
                const nextItalic = next?.object === 'text' && next.italic === true;
                if (!prevItalic) text = `_${text}`;
                if (!nextItalic) text += '_';
              }
              if (spoiler) {
                const prevSpoiler = prev?.object === 'text' && prev.spoiler === true;
                const nextSpoiler = next?.object === 'text' && next.spoiler === true;
                if (!prevSpoiler) text = `<Spoiler>${text}`;
                if (!nextSpoiler) text += '</Spoiler>';
              }
              return text;
            }
          }
        })
        .join(''),
    )
    .join('\n\n') ?? '';

export default slateToMd;
