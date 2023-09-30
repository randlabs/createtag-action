import * as core from '@actions/core';
import * as github from '@actions/github';
import { getBoolInput, getOctokit, getRepoOwnerInput } from './helpers';

// -----------------------------------------------------------------------------

async function run(): Promise<void> {
	// Create the GitHub accessor
	const octokit = getOctokit();

	// Get target owner and repository
	const { repo, owner } = getRepoOwnerInput();

	// Get tag to delete
	const tagName = core.getInput('tag');
	if (!tagName) {
		throw new Error('missing `tag` input');
	}

	// Get creation flags
	let createRelease = getBoolInput('create-release', true);
	let createTag = getBoolInput('create-tag', true);
	if (createRelease) {
		createTag = true;
	}
	if (!(createTag || createRelease)) {
		throw new Error('no action to execute');
	}

	// Get some other flags
	const ignoreExisting = getBoolInput('ignore-existing', true);

	// Get commit hash to use if one was specified
	let sha = core.getInput('sha');
	if (sha) {
		// Validate hash
		if (!((/[0-9a-f]{40}/ui).test(sha))) {
			throw new Error('the specified `sha` is invalid');
		}
	}
	else {
		// If no hash is provided, check if a branch is specified
		const branch = core.getInput('branch');
		if (branch) {
			// Get the last commit of the given branch
			const branchInfo = await octokit.rest.repos.getBranch({
				owner,
				repo,
				branch,
			});
			if (branchInfo.status !== 200) {
				throw new Error('failed to retrieve last branch tag');
			}
			sha = branchInfo.data.commit.sha;
			if (sha.length == 0) {
				throw new Error('the specified branch has no commits');
			}
		}
		else {
			// If none a hash nor a branch is provided, use the context hash
			sha = github.context.sha;
		}
	}

	// Execute action
	if (createRelease) {
		// Create a release of the given tag
		const draft = getBoolInput('draft', false);
		const prerelease = getBoolInput('pre-release', false);
		const generate_release_notes = getBoolInput('auto-notes', false);

		let name = core.getInput('name');
		if (!name) {
			name = ((prerelease) ? 'Pre-release ' : 'Release ') + tagName;
		}
		let body = core.getInput('body');
		if (!body) {
			body = name;
		}

		// Create a release of the given tag
		core.info('Creating release: ' + tagName);

		// Initialize variables to save output
		let releaseId = 0;
		let releaseUrl = '';
		let releaseUploadUrl = '';

		// Check if the release already exists
		try {
			const releaseInfo = await octokit.rest.repos.getReleaseByTag({
				owner,
				repo,
				tag: tagName,
			});
			if (releaseInfo.status === 200) {
				// Found an existing release
				core.info('-> found existing');

				releaseId = releaseInfo.data.id;
				releaseUrl = releaseInfo.data.url;
				releaseUploadUrl = releaseInfo.data.upload_url;
			}
		}
		catch (err: any) {
			// Handle release not found error
			if (err.status !== 404 && err.message !== 'Not Found') {
				throw err;
			}
		}

		// If we have no id, the release does not exist so create it
		if (releaseId == 0) {
			const releaseInfo = await octokit.rest.repos.createRelease({
				owner,
				repo,
				tag_name: tagName,
				target_commitish: sha,
				name,
				body,
				draft,
				prerelease,
				generate_release_notes
			});
			// Check status to ensure the release was created
			if (releaseInfo.status !== 201) {
				throw new Error('failed to create release');
			}

			releaseId = releaseInfo.data.id;
			releaseUrl = releaseInfo.data.url;
			releaseUploadUrl = releaseInfo.data.upload_url;
		}

		// Set action's output
		core.setOutput('id', releaseId.toString());
		core.setOutput('url', releaseUrl);
		core.setOutput('upload-url', releaseUploadUrl);
		core.setOutput('tag-sha', '');
	}
	else /* if (createTag) */ {
		// If we reach here, only a tag must be created
		core.info('Creating tag: ' + tagName);

		// Get tag's message
		const message = core.getInput('message');

		// Initialize variables to save output
		let commitHash = '';

		// Check if tag already exists
		try {
			const tagInfo = await octokit.rest.git.getRef({
				owner,
				repo,
				ref: 'refs/tags/' + tagName,
			});
			if (tagInfo.status === 200) {
				// Found an existing release
				if (!ignoreExisting) {
					throw new Error('a tag with the same name already exists');
				}

				if (tagInfo.data.object.type !== 'commit') {
					throw new Error('existing tag does not point to a commit');
				}

				core.info('-> found existing');
				commitHash = tagInfo.data.object.sha;
			}
		}
		catch (err: any) {
			// Handle release not found error
			if (err.status !== 404 && err.message !== 'Not Found') {
				throw err;
			}
		}

		// If we have commit hash, the tag does not exist so create it
		if (!commitHash) {
			// Create tag
			const tagInfo = await octokit.rest.git.createTag({
				owner,
				repo,
				tag: tagName,
				message,
				object: sha,
				type: 'commit',
			});
			// Check status to ensure the tag was created
			if (tagInfo.status !== 201) {
				throw new Error('failed to create tag object');
			}

			// Create the reference to the created tag
			const tagRef = await octokit.rest.git.createRef({
				owner,
				repo,
				ref: 'refs/tags/' + tagName,
				sha: tagInfo.data.sha
			});
			// Check status to ensure the tag reference was created
			if (tagRef.status !== 201) {
				throw new Error('failed to create tag reference');
			}

			commitHash = tagRef.data.object.sha;
		}

		// Set action's output
		core.setOutput('id', '');
		core.setOutput('url', '');
		core.setOutput('upload-url', '');
		core.setOutput('tag-sha', commitHash);
	}
}

// -----------------------------------------------------------------------------

run().catch((err: any) => {
	if (err instanceof Error) {
		core.setFailed(err.message);
	}
	else if (err.toString) {
		core.setFailed(err.toString());
	}
	else {
		core.setFailed('unknown error');
	}
});
