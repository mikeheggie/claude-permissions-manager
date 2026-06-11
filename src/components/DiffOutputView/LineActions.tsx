/**
 * LineActions Component
 *
 * Renders the action buttons for a permission line.
 * Contains delete button and re-categorize dropdown trigger.
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PermissionCategory } from '@/types/permissions'
import type { LineActionsProps } from '@/types/diffOutput'
import { CATEGORY_DISPLAY, getOtherCategories } from './helpers'

// =============================================================================
// Component
// =============================================================================

export function LineActions({
  permissionId,
  currentCategory,
  onDelete,
  onRecategorize,
  isDropdownOpen,
  onDropdownToggle,
}: LineActionsProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const otherCategories = getOtherCategories(currentCategory)

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isDropdownOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        onDropdownToggle(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen, onDropdownToggle])

  // Focus first menu item when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setFocusedIndex(0)
      // Slight delay to ensure DOM is ready
      requestAnimationFrame(() => {
        menuItemRefs.current[0]?.focus()
      })
    } else {
      setFocusedIndex(-1)
    }
  }, [isDropdownOpen])

  // Handle keyboard navigation on the trigger button
  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isDropdownOpen) {
            e.preventDefault()
            onDropdownToggle(false)
            buttonRef.current?.focus()
          }
          break
        case 'ArrowDown':
        case 'Enter':
        case ' ':
          if (!isDropdownOpen) {
            e.preventDefault()
            onDropdownToggle(true)
          }
          break
        case 'ArrowUp':
          if (!isDropdownOpen) {
            e.preventDefault()
            onDropdownToggle(true)
          }
          break
      }
    },
    [isDropdownOpen, onDropdownToggle]
  )

  // Handle keyboard navigation within the dropdown menu
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const itemCount = otherCategories.length

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onDropdownToggle(false)
          buttonRef.current?.focus()
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev >= itemCount - 1 ? 0 : prev + 1
            menuItemRefs.current[next]?.focus()
            return next
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => {
            const next = prev <= 0 ? itemCount - 1 : prev - 1
            menuItemRefs.current[next]?.focus()
            return next
          })
          break
        case 'Home':
          e.preventDefault()
          setFocusedIndex(0)
          menuItemRefs.current[0]?.focus()
          break
        case 'End':
          e.preventDefault()
          setFocusedIndex(itemCount - 1)
          menuItemRefs.current[itemCount - 1]?.focus()
          break
        case 'Tab':
          // Close dropdown on tab to allow natural tab flow
          onDropdownToggle(false)
          break
      }
    },
    [otherCategories.length, onDropdownToggle]
  )

  const handleDropdownToggle = useCallback(() => {
    onDropdownToggle(!isDropdownOpen)
  }, [isDropdownOpen, onDropdownToggle])

  const handleCategorySelect = useCallback(
    (category: PermissionCategory) => {
      onRecategorize(category)
      onDropdownToggle(false)
      buttonRef.current?.focus()
    },
    [onRecategorize, onDropdownToggle]
  )

  return (
    <div
      className="flex items-center gap-1"
      data-testid={`line-actions-${permissionId}`}
    >
      {/* Delete Button */}
      <button
        type="button"
        onClick={onDelete}
        className="p-1 rounded hover:bg-category-deny/10 text-foreground-muted hover:text-category-deny transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-category-deny focus-visible:ring-offset-1"
        aria-label="Delete permission"
        title="Remove from output"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      {/* Re-categorize Dropdown */}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleDropdownToggle}
          onKeyDown={handleTriggerKeyDown}
          className={`
            p-1 rounded transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-1
            ${isDropdownOpen
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'hover:bg-foreground-muted/10 text-foreground-muted hover:text-foreground'
            }
          `}
          aria-label="Change permission category"
          aria-expanded={isDropdownOpen}
          aria-haspopup="menu"
          aria-controls={isDropdownOpen ? `dropdown-menu-${permissionId}` : undefined}
          title="Move to different category"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 z-[100] min-w-[100px] bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden"
              role="menu"
              id={`dropdown-menu-${permissionId}`}
              aria-label="Select category"
              aria-activedescendant={focusedIndex >= 0 ? `menu-item-${permissionId}-${focusedIndex}` : undefined}
              onKeyDown={handleMenuKeyDown}
            >
              {otherCategories.map((category, index) => {
                const display = CATEGORY_DISPLAY[category]
                return (
                  <button
                    key={category}
                    ref={(el) => { menuItemRefs.current[index] = el }}
                    id={`menu-item-${permissionId}-${index}`}
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleCategorySelect(category)
                      }
                    }}
                    className={`
                      w-full px-3 py-2 text-left text-sm font-medium
                      hover:bg-bg-tertiary transition-colors
                      focus:outline-none focus:bg-bg-tertiary
                      flex items-center gap-2
                      ${display.color}
                    `}
                    role="menuitem"
                    tabIndex={focusedIndex === index ? 0 : -1}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                    {display.label}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
