"""
Team Agent Skill Builder - 验证脚本
用于检查 Skill 目录结构和文件完整性
"""

import os
import sys
from pathlib import Path
from typing import List, Tuple
import re

class SkillValidator:
    def __init__(self, skill_path: str):
        self.skill_path = Path(skill_path)
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.success: List[str] = []
        
    def validate(self) -> bool:
        """运行所有验证检查"""
        print(f"🔍 验证 Skill: {self.skill_path.name}\n")
        
        # 1. 检查目录存在
        if not self.skill_path.exists():
            self.errors.append(f"❌ Skill 目录不存在: {self.skill_path}")
            return False
            
        # 2. 检查必需文件
        self._check_required_files()
        
        # 3. 检查 SKILL.md 格式
        self._check_skill_md_format()
        
        # 4. 检查模板文件
        self._check_templates()
        
        # 5. 检查示例文件
        self._check_examples()
        
        # 6. 打印结果
        self._print_results()
        
        return len(self.errors) == 0
    
    def _check_required_files(self):
        """检查必需文件是否存在"""
        required_files = [
            "SKILL.md",
        ]
        
        for file in required_files:
            file_path = self.skill_path / file
            if file_path.exists():
                self.success.append(f"✅ 找到必需文件: {file}")
            else:
                self.errors.append(f"❌ 缺少必需文件: {file}")
    
    def _check_skill_md_format(self):
        """检查 SKILL.md 的 YAML frontmatter 和基本结构"""
        skill_md = self.skill_path / "SKILL.md"
        
        if not skill_md.exists():
            return
        
        with open(skill_md, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 检查 YAML frontmatter
        if content.startswith('---'):
            # 提取 frontmatter
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter = parts[1]
                
                # 检查必需字段
                if 'name:' in frontmatter:
                    self.success.append("✅ SKILL.md 包含 'name' 字段")
                else:
                    self.errors.append("❌ SKILL.md 缺少 'name' 字段")
                
                if 'description:' in frontmatter:
                    self.success.append("✅ SKILL.md 包含 'description' 字段")
                else:
                    self.errors.append("❌ SKILL.md 缺少 'description' 字段")
            else:
                self.errors.append("❌ SKILL.md 的 YAML frontmatter 格式不正确")
        else:
            self.errors.append("❌ SKILL.md 缺少 YAML frontmatter")
        
        # 检查关键章节
        required_sections = [
            "系统目标",
            "核心工作流",
        ]
        
        for section in required_sections:
            if section in content:
                self.success.append(f"✅ SKILL.md 包含 '{section}' 章节")
            else:
                self.warnings.append(f"⚠️ SKILL.md 建议包含 '{section}' 章节")
    
    def _check_templates(self):
        """检查模板目录和文件"""
        templates_dir = self.skill_path / "templates"
        
        if templates_dir.exists():
            self.success.append("✅ 找到 templates 目录")
            
            # 检查模板文件数量
            template_files = list(templates_dir.glob("*.md"))
            if len(template_files) >= 1:
                self.success.append(f"✅ 找到 {len(template_files)} 个模板文件")
            else:
                self.warnings.append("⚠️ templates 目录为空，建议添加模板文件")
        else:
            self.warnings.append("⚠️ 未找到 templates 目录（可选）")
    
    def _check_examples(self):
        """检查示例目录和文件"""
        examples_dir = self.skill_path / "examples"
        
        if examples_dir.exists():
            self.success.append("✅ 找到 examples 目录")
            
            # 检查示例文件数量
            example_files = list(examples_dir.glob("*.md"))
            if len(example_files) >= 1:
                self.success.append(f"✅ 找到 {len(example_files)} 个示例文件")
            else:
                self.warnings.append("⚠️ examples 目录为空，建议添加示例文件")
        else:
            self.warnings.append("⚠️ 未找到 examples 目录（可选）")
    
    def _print_results(self):
        """打印验证结果"""
        print("\n" + "="*60)
        print("📊 验证结果")
        print("="*60 + "\n")
        
        if self.success:
            print("✅ 成功项:")
            for item in self.success:
                print(f"  {item}")
            print()
        
        if self.warnings:
            print("⚠️ 警告项:")
            for item in self.warnings:
                print(f"  {item}")
            print()
        
        if self.errors:
            print("❌ 错误项:")
            for item in self.errors:
                print(f"  {item}")
            print()
        
        # 总结
        print("="*60)
        if len(self.errors) == 0:
            print("🎉 验证通过！Skill 结构完整。")
        else:
            print(f"❌ 验证失败！发现 {len(self.errors)} 个错误。")
        print("="*60)


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法: python validate_skill.py <skill_directory_path>")
        print("\n示例:")
        print("  python validate_skill.py d:/Antigravity/Jackypotato/skills/team-agent-skill-builder")
        sys.exit(1)
    
    skill_path = sys.argv[1]
    validator = SkillValidator(skill_path)
    
    success = validator.validate()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
