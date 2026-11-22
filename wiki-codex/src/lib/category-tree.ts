import type { Category, CategoryTreeNode } from "@/types/codex";
import { matchesVietnameseQuery } from "./vietnamese";

/**
 * Check if setting `newParentId` as parent of `categoryId` would create a cycle
 * (including self-parenting or parenting under any descendant).
 */
export function wouldCreateCategoryCycle(
  categories: Category[],
  categoryId: string,
  newParentId: string | null
): boolean {
  if (!newParentId) return false;
  if (categoryId === newParentId) return true;

  const byId = new Map<string, Category>();
  for (const cat of categories) {
    byId.set(cat.id, cat);
  }

  const visited = new Set<string>([categoryId]);
  let current: string | null = newParentId;
  while (current) {
    if (visited.has(current)) return true;
    visited.add(current);
    const node = byId.get(current);
    current = node ? node.parentId : null;
  }
  return false;
}

/**
 * Collect categoryId and all of its active descendant category IDs.
 */
export function getDescendantCategoryIds(
  categories: Category[],
  rootCategoryId: string
): Set<string> {
  const active = categories.filter((c) => !c.deletedAt);
  const childrenByParent = new Map<string, string[]>();
  for (const cat of active) {
    if (cat.parentId) {
      const list = childrenByParent.get(cat.parentId) ?? [];
      list.push(cat.id);
      childrenByParent.set(cat.parentId, list);
    }
  }

  const result = new Set<string>([rootCategoryId]);
  const stack = [rootCategoryId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const children = childrenByParent.get(id) ?? [];
    for (const childId of children) {
      if (!result.has(childId)) {
        result.add(childId);
        stack.push(childId);
      }
    }
  }
  return result;
}

export interface EntryCategoryRef {
  id: string;
  categoryId: string | null;
}

/**
 * Build multi-level category tree (Cha -> Con -> Cháu) with exact, non-duplicate
 * descendant item counts using unique entry ID Sets.
 */
export function buildCategoryTree(
  categories: Category[],
  entries: EntryCategoryRef[],
  filterQuery = ""
): CategoryTreeNode[] {
  const activeCategories = categories.filter((c) => !c.deletedAt);
  const activeIds = new Set(activeCategories.map((c) => c.id));

  // Group unique entry IDs directly assigned to each category
  const directEntrySets = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (entry.categoryId && activeIds.has(entry.categoryId)) {
      let set = directEntrySets.get(entry.categoryId);
      if (!set) {
        set = new Set<string>();
        directEntrySets.set(entry.categoryId, set);
      }
      set.add(entry.id);
    }
  }

  // Group children by parentId
  const childrenMap = new Map<string | null, Category[]>();
  for (const cat of activeCategories) {
    const effectiveParent =
      cat.parentId && activeIds.has(cat.parentId) && cat.parentId !== cat.id
        ? cat.parentId
        : null;
    const list = childrenMap.get(effectiveParent) ?? [];
    list.push(cat);
    childrenMap.set(effectiveParent, list);
  }

  const sortCats = (list: Category[]) =>
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"));

  const trimmedQuery = filterQuery.trim();

  function buildNode(
    cat: Category,
    depth: number,
    ancestors: Set<string>
  ): { node: CategoryTreeNode; uniqueIds: Set<string> } {
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(cat.id);

    const directSet = directEntrySets.get(cat.id) ?? new Set<string>();
    const combinedSet = new Set<string>(directSet);

    const rawChildren = sortCats(childrenMap.get(cat.id) ?? []);
    const childNodes: CategoryTreeNode[] = [];

    for (const child of rawChildren) {
      if (nextAncestors.has(child.id)) continue; // Defensive cycle guard
      const built = buildNode(child, depth + 1, nextAncestors);
      for (const entryId of built.uniqueIds) {
        combinedSet.add(entryId);
      }
      childNodes.push(built.node);
    }

    const matchesFilter = trimmedQuery
      ? matchesVietnameseQuery(`${cat.name} ${cat.description}`, trimmedQuery)
      : true;
    const hasMatchingDescendant = childNodes.some(
      (c) => c.matchesFilter || c.hasMatchingDescendant
    );

    const node: CategoryTreeNode = {
      ...cat,
      depth,
      directCount: directSet.size,
      totalUniqueCount: combinedSet.size,
      children: trimmedQuery
        ? childNodes.filter((c) => c.matchesFilter || c.hasMatchingDescendant)
        : childNodes,
      matchesFilter,
      hasMatchingDescendant
    };

    return { node, uniqueIds: combinedSet };
  }

  const roots = sortCats(childrenMap.get(null) ?? []);
  const builtRoots = roots.map((root) => buildNode(root, 0, new Set()).node);

  if (trimmedQuery) {
    return builtRoots.filter((r) => r.matchesFilter || r.hasMatchingDescendant);
  }
  return builtRoots;
}

/**
 * Collect all category IDs that should auto-expand when filtering.
 */
export function collectAutoExpandedIds(nodes: CategoryTreeNode[]): string[] {
  const expanded: string[] = [];
  function walk(list: CategoryTreeNode[]) {
    for (const n of list) {
      if (n.hasMatchingDescendant) {
        expanded.push(n.id);
      }
      walk(n.children);
    }
  }
  walk(nodes);
  return expanded;
}

/**
 * Collect all category IDs that have children (for "Mở rộng tất cả").
 */
export function collectAllParentIds(nodes: CategoryTreeNode[]): string[] {
  const ids: string[] = [];
  function walk(list: CategoryTreeNode[]) {
    for (const n of list) {
      if (n.children.length > 0) {
        ids.push(n.id);
        walk(n.children);
      }
    }
  }
  walk(nodes);
  return ids;
}
