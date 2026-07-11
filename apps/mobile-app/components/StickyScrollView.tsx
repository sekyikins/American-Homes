import React from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import SectionHeader from './SectionHeader';

interface StickyScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
}

/** Recursively flatten React fragments so every child is a concrete element */
function flattenChildren(children: React.ReactNode): React.ReactNode[] {
  const flat: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === React.Fragment) {
      flat.push(...flattenChildren((child.props as any).children));
    } else {
      flat.push(child);
    }
  });
  return flat;
}

export default function StickyScrollView({ children, stickyHeaderIndices = [], ...props }: StickyScrollViewProps) {
  const flatChildren = React.useMemo(() => flattenChildren(children), [children]);

  const computedStickyIndices = React.useMemo(() => {
    const indices: number[] = [...stickyHeaderIndices];
    flatChildren.forEach((child, index) => {
      if (React.isValidElement(child)) {
        const typeName = (child.type as any)?.name || '';
        const isSectionHeader = child.type === SectionHeader || typeName === 'SectionHeader';
        if (isSectionHeader) {
          indices.push(index);
        }
      }
    });
    return indices;
  }, [flatChildren, stickyHeaderIndices]);

  return (
    <ScrollView stickyHeaderIndices={computedStickyIndices} {...props}>
      {flatChildren}
    </ScrollView>
  );
}
