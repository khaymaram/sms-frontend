import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Collapsible from './Collapsible';
import type { NavigationItem } from '@/data/navigation';

interface SidebarItemProps {
  item: NavigationItem;
  isCollapsed: boolean;
  level?: number;
}

/**
 * Checks if a pathname matches a nav path (exact or nested under it).
 */
const pathMatches = (pathname: string, path: string): boolean =>
  pathname === path || pathname.startsWith(path + '/');

/**
 * Recursively checks if any child of a navigation item is active.
 * @param item - The navigation item to check.
 * @param pathname - The current URL path.
 * @returns True if a child item is active, false otherwise.
 */
const isChildRouteActive = (item: NavigationItem, pathname: string): boolean => {
  if (!item.children) {
    return false;
  }
  return item.children.some(child => {
    if (child.path && pathMatches(pathname, child.path)) {
      return true;
    }
    return isChildRouteActive(child, pathname);
  });
};

const SidebarItem = ({ item, isCollapsed, level = 0 }: SidebarItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const hasChildren = !!(item.children && item.children.length > 0);

  // An item is active if its path matches exactly or the current path is nested under it.
  const isActive = item.path ? pathMatches(location.pathname, item.path) : false;

  // Determine if the item is a parent of the currently active route.
  const isParentOfActiveItem = hasChildren && isChildRouteActive(item, location.pathname);

  const [isOpen, setIsOpen] = useState(isParentOfActiveItem);

  // Effect to automatically open/close dropdowns when the route changes.
  useEffect(() => {
    if (!isCollapsed) {
      setIsOpen(isParentOfActiveItem);
    }
  }, [location.pathname, isCollapsed, isParentOfActiveItem]);

  const handleClick = () => {
    if (hasChildren && !isCollapsed) {
      setIsOpen(!isOpen);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // Dynamic padding based on nesting level (supports up to 3 levels deep)
  const paddingLeft = level === 0 ? 'pl-4' : level === 1 ? 'pl-8' : level === 2 ? 'pl-12' : 'pl-16';

  return (
    <div className="w-full relative group">
      {/* Main Item */}
      <button
        onClick={handleClick}
        className={`
          w-full cursor-pointer flex items-center justify-between gap-3 rounded-md
          transition-all duration-200
          ${
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }
          ${isCollapsed ? 'justify-center p-2' : `${paddingLeft} p-2`}
          ${level === 0 ? 'h-11 text-sm' : 'h-10 text-sm'}
        `}
        title={isCollapsed ? item.label : undefined}
      >
        <div
          className={`flex min-w-0 flex-1 ${isCollapsed ? 'justify-center' : 'items-center gap-3'}`}
        >
          {/* Icon */}
          {item.icon && (
            <span
              className={`shrink-0 ${
                isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground/70'
              }`}
            >
              {item.icon}
            </span>
          )}

          {/* Label - only show when not collapsed */}
          {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
        </div>

        {/* Expand/Collapse Icon - only for items with children and not collapsed */}
        {hasChildren && !isCollapsed && (
          <span className="shrink-0">
            {isOpen ? (
              <ChevronDown size={16} className="text-sidebar-foreground/60" />
            ) : (
              <ChevronRight size={16} className="text-sidebar-foreground/60" />
            )}
          </span>
        )}
      </button>

      {/* Tooltip / Flyout for collapsed sidebar */}
      {isCollapsed && (
        <div
          className="
            absolute left-full ml-2 top-0
            rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200 z-50
          "
        >
          {!hasChildren ? (
            <div
              className="
              px-3 py-2 bg-slate-900 text-white text-base
              rounded-lg whitespace-nowrap pointer-events-none
            "
            >
              {item.label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900"></div>
            </div>
          ) : (
            <div className="p-2 w-56 bg-sidebar text-sidebar-foreground shadow-lg rounded-md border border-sidebar-border/50">
              <div className="font-medium text-sm px-2 py-1.5 text-sidebar-foreground">
                {item.label}
              </div>
              {item.children?.map((child, index) => (
                <SidebarItem
                  key={index}
                  item={child}
                  isCollapsed={false}
                  level={0}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nested Children */}
      {hasChildren && !isCollapsed && (
        <Collapsible isOpen={isOpen}>
          <div
            className={`
            ${level === 0 ? 'bg-black/10 border-l-2 border-sidebar-border/50 ml-4' : ''}
            ${level === 1 ? 'border-l border-sidebar-border/50 ml-8' : ''}
          `}
          >
            {item.children?.map((child, index) => (
              <SidebarItem
                key={index}
                item={child}
                isCollapsed={isCollapsed}
                level={level + 1}
              />
            ))}
          </div>
        </Collapsible>
      )}
    </div>
  );
};

export default SidebarItem;
