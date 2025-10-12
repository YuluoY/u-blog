// more：https://github.com/angular/angular/blob/main/CONTRIBUTING.md
module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			2,
			'always',
			[
				'build', // 编译相关的修改，如发布版本，对项目构建或依赖的改动
				'ci', // 对CI 配置文件和脚本的更改
				'chore', // 构建过程或辅助工具的变动，比如增加依赖库等
				'update', // 更新功能
				'docs', // 文档变动 documentation
				'feat', // 新增功能 feature
				'fix', // 修复bug
				'perf', // 性能优化  performance
				'refactor', // 重构
				'revert', // 撤回commit，回滚上一个版本
				'style', // 格式（不影响代码运行的变动）
				'test' // 测试（单元/集成测试）
			]
		],
		'type-case': [0],
		'type-empty': [0],
		'scope-empty': [0],
		'scope-case': [0],
		'subject-full-stop': [0, 'never'],
		'subject-case': [0, 'never'],
		'header-max-length': [0, 'always', 100]
	}
}
