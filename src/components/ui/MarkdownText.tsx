import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MarkdownTextProps {
  content: string;
  isUser?: boolean;
}

/**
 * Parses inline tokens: bold (**), italic (*), underline (<u> or __), code (`)
 */
function renderInline(text: string, isUser: boolean, baseStyle?: any) {
  // Regex to match markdown tokens
  // 1: ***bold italic***
  // 2: **bold**
  // 3: *italic*
  // 4: <u>underline</u> or __underline__
  // 5: `code`
  const tokenRegex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|<u>[^<]+<\/u>|__[^_]+__|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('***') && part.endsWith('***')) {
      const inner = part.slice(3, -3);
      return (
        <Text key={index} style={[styles.bold, styles.italic]}>
          {inner}
        </Text>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <Text key={index} style={styles.bold}>
          {inner}
        </Text>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1);
      return (
        <Text key={index} style={styles.italic}>
          {inner}
        </Text>
      );
    }

    if ((part.startsWith('<u>') && part.endsWith('</u>')) || (part.startsWith('__') && part.endsWith('__'))) {
      const inner = part.startsWith('<u>') ? part.slice(3, -4) : part.slice(2, -2);
      return (
        <Text key={index} style={styles.underline}>
          {inner}
        </Text>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      const inner = part.slice(1, -1);
      return (
        <Text
          key={index}
          style={[
            styles.code,
            isUser ? styles.codeUser : styles.codeAgent,
          ]}
        >
          {` ${inner} `}
        </Text>
      );
    }

    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, isUser = false }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  const textColor = isUser ? '#FFFFFF' : '#1F2937';
  const bulletColor = isUser ? '#A7F3D0' : '#124E2A';

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Empty lines -> small spacing
    if (!trimmed) {
      elements.push(<View key={`empty-${lineIdx}`} style={styles.spacer} />);
      return;
    }

    // Horizontal Rule: ---
    if (/^---{1,}$/.test(trimmed)) {
      elements.push(
        <View
          key={`hr-${lineIdx}`}
          style={[
            styles.hr,
            { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : '#E5E7EB' },
          ]}
        />
      );
      return;
    }

    // Headings: #, ##, ###
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^(#{1,3})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2];
        const headingStyle =
          level === 1
            ? styles.h1
            : level === 2
            ? styles.h2
            : styles.h3;

        elements.push(
          <Text
            key={`h-${lineIdx}`}
            style={[headingStyle, { color: textColor }]}
          >
            {renderInline(headingText, isUser, { color: textColor })}
          </Text>
        );
        return;
      }
    }

    // Bullet List: - item, * item, • item
    if (/^[-*•]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*•]\s+/, '');
      elements.push(
        <View key={`bullet-${lineIdx}`} style={styles.listRow}>
          <Text style={[styles.bulletPoint, { color: bulletColor }]}>•</Text>
          <Text style={[styles.listText, { color: textColor }]}>
            {renderInline(itemText, isUser, { color: textColor })}
          </Text>
        </View>
      );
      return;
    }

    // Numbered List: 1. item, 2. item, etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[1];
      const itemText = numMatch[2];
      elements.push(
        <View key={`num-${lineIdx}`} style={styles.listRow}>
          <Text style={[styles.numPoint, { color: bulletColor }]}>{num}.</Text>
          <Text style={[styles.listText, { color: textColor }]}>
            {renderInline(itemText, isUser, { color: textColor })}
          </Text>
        </View>
      );
      return;
    }

    // Blockquote: > quote
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <View
          key={`quote-${lineIdx}`}
          style={[
            styles.quoteBox,
            {
              borderLeftColor: isUser ? '#A7F3D0' : '#124E2A',
              backgroundColor: isUser ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
            },
          ]}
        >
          <Text style={[styles.quoteText, { color: textColor }]}>
            {renderInline(quoteText, isUser, { color: textColor })}
          </Text>
        </View>
      );
      return;
    }

    // Normal Paragraph line
    elements.push(
      <Text
        key={`p-${lineIdx}`}
        style={[styles.paragraph, { color: textColor }]}
      >
        {renderInline(line, isUser, { color: textColor })}
      </Text>
    );
  });

  return <View style={styles.container}>{elements}</View>;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    marginVertical: 1,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  codeAgent: {
    backgroundColor: '#F3F4F6',
    color: '#047857',
  },
  codeUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ECFDF5',
  },
  spacer: {
    height: 6,
  },
  hr: {
    height: 1,
    marginVertical: 6,
  },
  h1: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 3,
  },
  h2: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 5,
    marginBottom: 2,
  },
  h3: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1.5,
    paddingLeft: 2,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 20,
    marginRight: 6,
    fontWeight: '900',
  },
  numPoint: {
    fontSize: 13,
    lineHeight: 20,
    marginRight: 6,
    fontWeight: '700',
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  quoteBox: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 3,
    marginVertical: 3,
    borderRadius: 2,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
});
