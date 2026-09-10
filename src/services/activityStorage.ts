import { useState, useEffect } from 'react';
import { Activity } from '../types';
import { ACTIVITIES } from '../data/activities';

const STORAGE_KEY = 'mrchecho_curriculum_activities_v2';
const EVENT_NAME = 'mrchecho_activities_updated';

export const DEPRECATED_TEST_ACTIVITY_IDS = new Set([
  'continents-and-oceans-explorer',
  'ancient-egypt-nile-valley',
]);

// In-memory cache
let customActivitiesCache: Activity[] | null = null;

function loadCustomActivities(): Activity[] {
  if (customActivitiesCache !== null) {
    return customActivitiesCache;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out any legacy test activity records if found in localStorage
        const sanitized = parsed.filter(
          (c: Activity) => !DEPRECATED_TEST_ACTIVITY_IDS.has(c.id)
        );
        if (sanitized.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        }
        customActivitiesCache = sanitized;
        return customActivitiesCache;
      }
    }
  } catch (err) {
    console.warn('Could not read custom activities from storage:', err);
  }

  customActivitiesCache = [];
  return customActivitiesCache;
}

/**
 * Returns all activities (base built-in activities + custom teacher-created activities).
 */
export function getActivities(): Activity[] {
  const custom = loadCustomActivities();
  const builtIn = ACTIVITIES.filter((a) => !DEPRECATED_TEST_ACTIVITY_IDS.has(a.id));
  const builtInIds = new Set(builtIn.map((a) => a.id));
  const uniqueCustom = custom.filter(
    (c) => !builtInIds.has(c.id) && !DEPRECATED_TEST_ACTIVITY_IDS.has(c.id)
  ).map((c) => ({
    ...c,
    grade: c.grade || 'both',
    category: c.category || c.topic || 'Social Studies',
  }));
  return [...builtIn, ...uniqueCustom];
}

/**
 * Finds an activity by its unique ID across built-in and custom activities.
 */
export function getActivityById(id: string): Activity | undefined {
  return getActivities().find((a) => a.id === id);
}

/**
 * Saves a new or updated activity to local curriculum storage and broadcasts the update.
 */
export async function saveCustomActivity(activity: Activity): Promise<Activity> {
  const current = loadCustomActivities();
  const existingIdx = current.findIndex((a) => a.id === activity.id);

  let updatedList: Activity[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = activity;
  } else {
    updatedList = [...current, activity];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to write activity to localStorage:', err);
  }

  customActivitiesCache = updatedList;

  // Broadcast to current window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: activity }));
  }

  return activity;
}

/**
 * Subscribes to changes in the activities list (handles storage events across tabs & custom events in-tab).
 */
export function subscribeToActivities(callback: (activities: Activity[]) => void): () => void {
  // Initial callback
  callback(getActivities());

  const handleUpdate = () => {
    customActivitiesCache = null; // force reload
    callback(getActivities());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        handleUpdate();
      }
    });
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    }
  };
}

/**
 * React hook to consume and reactively update activities across the application.
 */
export function useActivities(): Activity[] {
  const [activities, setActivities] = useState<Activity[]>(() => getActivities());

  useEffect(() => {
    const unsub = subscribeToActivities((list) => {
      setActivities(list);
    });
    return () => unsub();
  }, []);

  return activities;
}
