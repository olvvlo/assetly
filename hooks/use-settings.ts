import { storage } from '#imports'
import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

interface AppearanceSettings {
  theme: Theme
}

interface SystemSettings {
  notifications: boolean
  syncInterval: number
  ocrApiKey: string
  deepseekApiKey: string
}

export interface PersonalInfo {
  birthDate: string
  education: string
  familyStatus: string
  occupation: string
  location: string
  // 保留age字段用于兼容性，但优先使用birthDate
  age?: number | null
}

interface UISettings {
  activeTab: string
}

// Define storage items
const appearanceSettings = storage.defineItem<AppearanceSettings>('local:appearanceSettings', {
  fallback: {
    theme: 'system'
  }
})

const systemSettings = storage.defineItem<SystemSettings>('local:systemSettings', {
  fallback: {
    notifications: true,
    syncInterval: 15,
    ocrApiKey: '',
    deepseekApiKey: ''
  }
})

const personalInfoSettings = storage.defineItem<PersonalInfo>('local:personalInfo', {
  fallback: {
    birthDate: '',
    education: '',
    familyStatus: '',
    occupation: '',
    location: ''
  }
})

const uiSettings = storage.defineItem<UISettings>('local:uiSettings', {
  fallback: {
    activeTab: 'home'
  }
})

export function useSettings() {
  const [appearance, setAppearance] = useState<AppearanceSettings>({ theme: 'system' })
  const [system, setSystem] = useState<SystemSettings>({ notifications: true, syncInterval: 15, ocrApiKey: '', deepseekApiKey: '' })
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({ birthDate: '', education: '', familyStatus: '', occupation: '', location: '' })
  const [ui, setUI] = useState<UISettings>({ activeTab: 'home' })
  const [loading, setLoading] = useState(true)

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [appearanceData, systemData, personalData, uiData] = await Promise.all([
          appearanceSettings.getValue(),
          systemSettings.getValue(),
          personalInfoSettings.getValue(),
          uiSettings.getValue()
        ])
        
        setAppearance(appearanceData)
        setSystem(systemData)
        setPersonalInfo(personalData)
        setUI(uiData)
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Update appearance settings
  const updateAppearance = async (updates: Partial<AppearanceSettings>) => {
    const newSettings = { ...appearance, ...updates }
    setAppearance(newSettings)
    try {
      await appearanceSettings.setValue(newSettings)
    } catch (error) {
      console.error('Failed to save appearance settings:', error)
    }
  }

  // Update system settings
  const updateSystem = async (updates: Partial<SystemSettings>) => {
    const newSettings = { ...system, ...updates }
    setSystem(newSettings)
    try {
      await systemSettings.setValue(newSettings)
    } catch (error) {
      console.error('Failed to save system settings:', error)
    }
  }

  // Update personal info
  const updatePersonalInfo = async (updates: Partial<PersonalInfo>) => {
    const newSettings = { ...personalInfo, ...updates }
    setPersonalInfo(newSettings)
    try {
      await personalInfoSettings.setValue(newSettings)
    } catch (error) {
      console.error('Failed to save personal info:', error)
    }
  }

  // Update UI settings
  const updateUI = async (updates: Partial<UISettings>) => {
    const newSettings = { ...ui, ...updates }
    setUI(newSettings)
    try {
      await uiSettings.setValue(newSettings)
    } catch (error) {
      console.error('Failed to save UI settings:', error)
    }
  }

  // Reset all settings
  const resetSettings = async () => {
    try {
      await Promise.all([
        appearanceSettings.removeValue(),
        systemSettings.removeValue(),
        personalInfoSettings.removeValue(),
        uiSettings.removeValue()
      ])
      
      // Reset to default values
      const defaultAppearance = { theme: 'system' as Theme }
      const defaultSystem = { notifications: true, syncInterval: 15, ocrApiKey: '', deepseekApiKey: '' }
      const defaultPersonalInfo = { birthDate: '', education: '', familyStatus: '', occupation: '', location: '' }
      const defaultUI = { activeTab: 'home' }
      
      setAppearance(defaultAppearance)
      setSystem(defaultSystem)
      setPersonalInfo(defaultPersonalInfo)
      setUI(defaultUI)
    } catch (error) {
      console.error('Failed to reset settings:', error)
    }
  }

  return {
    appearance,
    system,
    personalInfo,
    ui,
    loading,
    updateAppearance,
    updateSystem,
    updatePersonalInfo,
    updateUI,
    resetSettings
  }
}
