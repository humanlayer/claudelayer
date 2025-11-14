import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod'
import { getSubagents, type AgentConfiguration } from './subagents'
import { file, spawn, which } from 'bun'
import * as fs from 'node:fs/promises' 

// Configure the MCP server
export const server = new McpServer({
    name: 'agent',
    version: '1.0.0'
})
export default server
// TODO discover subagents

// Ensure claude is configured
const claudePath = which('claude')
if (!claudePath) throw new Error("Unable to locate path to claude binary, please ensure PATH is configured properly")

// Load subagents off disk from .claude/agents
const subagents = await getSubagents()
const agentConfigurations: Record<string, AgentConfiguration> = {}
subagents.forEach(a => {agentConfigurations[a.name] = a})

// Create a json object of descriptions
const subagentInfo: string = `<agents>\n${subagents.map(a => `<agent>\n<name>${a.name}</name>\n<description>${a.description}</description>\n</agent>\n`).join('')}</agents>`

// register a single tool to launch sub-agents - not multiple - avoid context rot!
server.registerTool(
    'launch', 
    {
        title: 'Launch sub-agent',
        description: `Launch sub-agents. Agent types & descriptions: ` + subagentInfo,
        inputSchema: z.object({
            name: z.enum(subagents.map(a => a.name) as [string, ...string[]]).describe('The name of the sub-agent to dispatch'),
            input: z.string().describe('The prompt for the sub-agent about the task to complete. Be as detailed as possible about the task, any imporant context, and the expected output information and format.')
        }),
    }, 
    async ({name, input}) => {
        const subagent = agentConfigurations[name]

        // If the agent name is not valid, return the list of valid sub-agents and descriptions
        if (!subagent) return {content: [{type: 'text', text: `<error>\nInvalid Sub-agent name. Valid sub-agents: ${subagentInfo}\n</error>`}]}
        
        const prompt = `${subagent.prompt}\n\n<user_instruction>${input}</user_instruction>`

        const claudeSubprocess = spawn([
            claudePath, 
            '-p', prompt, 
            '--model', 'claude-haiku-4-5',
            '--dangerously-skip-permissions'
        ], {
            stdout: 'pipe', 
            stderr: 'pipe'
        })

        const claudeResponse = await claudeSubprocess.stdout.text()
        await fs.appendFile('output.log', claudeResponse)
        return { content: [{type: 'text', text: claudeResponse}]}
    }
)

const transport = new StdioServerTransport();
await server.connect(transport);

