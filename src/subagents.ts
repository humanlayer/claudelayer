import { cwd } from 'node:process'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { file } from 'bun'
import { YAML } from 'bun'

export interface AgentConfiguration {
    name: string
    description: string
    prompt: string
    model?: string
}

export async function getSubagents(): Promise<[AgentConfiguration, ...AgentConfiguration[]]> {
    const workDir = cwd()
    const agentsDir = path.join(workDir, '.claude/agents')
    
    const agentFilePaths = (await fs.readdir(agentsDir, {recursive: true})).map((relativePath: string) => path.join(agentsDir, relativePath))
    const agentConfigPromises = await Promise.allSettled(agentFilePaths.map(fp => loadSubagentConfig(fp)))

    const agents: Array<AgentConfiguration> = []
    let failedLoads: number = 0
    for (const configPromise of agentConfigPromises) {
        if (configPromise.status === 'rejected') {
            failedLoads++
        }
        else {
            agents.push(configPromise.value)
        }
    }
    if (agents.length === 0) throw new Error("No sub-agents detected")
    return agents as [AgentConfiguration, ...AgentConfiguration[]]

}

/**
 * Turn a raw subagent file into an agent configuration
 * @param filePath 
 */
async function loadSubagentConfig(filePath: string): Promise<AgentConfiguration> {

    const agentFile = file(filePath)
    const text = await agentFile.text()
    const [frontMatter, prompt] = text.split('---').filter(item => !!item.length).map(s => s.trim()) // filter out empty strings
    if (!frontMatter || !prompt) throw new Error(`Bad agent configuration file: ${filePath}, ${JSON.stringify({frontMatter, prompt})}`, )
    const { name, description, model } = YAML.parse(frontMatter) as Record<string, any>
    if (!name || !description) throw new Error(`Bad agent configuration file: ${filePath}, ${JSON.stringify({name, description})}`)

    return { name, description, prompt, model}

}